#!/usr/bin/env bash
# Sauvegarde nocturne compressée de la base PostgreSQL BMC FOOD (conservation des 14 dernières).
# Aucun mot de passe en clair : utilise ~/.pgpass (ou PGPASSFILE) ou lit DATABASE_URL depuis /etc/bmc/backend.env.

set -euo pipefail
umask 077

BACKUP_DIR="${BMC_BACKUP_DIR:-/var/backups/bmc}"
ENV_FILE="${BMC_ENV_FILE:-/etc/bmc/backend.env}"
KEEP_COUNT="${BMC_BACKUP_KEEP:-14}"
TIMESTAMP="$(date +%Y%m%d_%H%M%S)"

mkdir -p "${BACKUP_DIR}"
chmod 700 "${BACKUP_DIR}"

# Charger les variables d'environnement si présentes (sans exposer de secrets dans les logs)
if [[ -f "${ENV_FILE}" ]]; then
  set -a
  # shellcheck disable=SC1090
  source "${ENV_FILE}"
  set +a
fi

# Extraire les paramètres libpq depuis DATABASE_URL (sans passer de mot de passe en argument CLI)
if [[ -z "${PGDATABASE:-}" && -n "${DATABASE_URL:-}" ]]; then
  eval "$(
    python3 -c '
import os, shlex
from urllib.parse import urlparse, unquote
u = urlparse(os.environ["DATABASE_URL"])
for key, val in [
    ("PGHOST", u.hostname or "127.0.0.1"),
    ("PGPORT", str(u.port or 5432)),
    ("PGUSER", unquote(u.username or "")),
    ("PGPASSWORD", unquote(u.password or "")),
    ("PGDATABASE", u.path.lstrip("/")),
]:
    if val:
        print(f"export {key}={shlex.quote(val)}")
'
  )"
fi

: "${PGHOST:=127.0.0.1}"
: "${PGPORT:=5432}"
: "${PGUSER:=bmc_user}"
: "${PGDATABASE:=bmc_food}"

ARCHIVE_PATH="${BACKUP_DIR}/bmc_food_${TIMESTAMP}.sql.gz"
TMP_PATH="${ARCHIVE_PATH}.tmp"

echo "[$(date -Is)] Export PostgreSQL de ${PGDATABASE}@${PGHOST}:${PGPORT}..."
pg_dump --clean --if-exists --no-owner --no-acl -h "${PGHOST}" -p "${PGPORT}" -U "${PGUSER}" "${PGDATABASE}" \
  | gzip -9 > "${TMP_PATH}"

# Vérification d'intégrité de l'archive compressée avant validation
gzip -t "${TMP_PATH}"
mv "${TMP_PATH}" "${ARCHIVE_PATH}"
chmod 600 "${ARCHIVE_PATH}"
echo "[$(date -Is)] Sauvegarde créée : ${ARCHIVE_PATH} ($(du -h "${ARCHIVE_PATH}" | cut -f1))"

# Rotation : conserver uniquement les 14 sauvegardes les plus récentes
mapfile -t OLD_BACKUPS < <(ls -1t "${BACKUP_DIR}"/bmc_food_*.sql.gz 2>/dev/null | tail -n "+$((KEEP_COUNT + 1))" || true)
if (( ${#OLD_BACKUPS[@]} > 0 )); then
  rm -f -- "${OLD_BACKUPS[@]}"
  echo "[$(date -Is)] Rotation effectuée : ${#OLD_BACKUPS[@]} ancienne(s) archive(s) supprimée(s) (${KEEP_COUNT} conservées)."
fi

# --- Copie hors du serveur (exemples à adapter et décommenter) ---------------
# Option 1 : via rclone vers un stockage objet / Google Drive / S3 / Backblaze
# rclone copy "${ARCHIVE_PATH}" bmc-remote:bmc-backups/postgres/
#
# Option 2 : via scp vers un autre serveur sécurisé par clé SSH dédiée
# scp -i /root/.ssh/id_backup_ed25519 "${ARCHIVE_PATH}" backup@serveur-distant.exemple:/srv/backups/bmc/
