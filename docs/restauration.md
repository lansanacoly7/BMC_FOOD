# Sauvegardes et restauration de la base PostgreSQL — BMC FOOD

Les commandes client, comptes utilisateurs et réglages métier sont stockés dans PostgreSQL (`bmc_food`). Le script [`deploy/backup.sh`](../deploy/backup.sh) génère chaque nuit un export compressé (`.sql.gz`) dans `/var/backups/bmc/` et conserve automatiquement les **14 dernières sauvegardes**.

Aucun mot de passe en clair n'est écrit dans les scripts ni dans la crontab : les identifiants sont lus depuis `/etc/bmc/backend.env` ou `~/.pgpass`.

---

## 1. Activer la sauvegarde automatique chaque nuit

### Option A (recommandée) : Timer systemd
Copiez les deux unités fournies et activez le timer (exécution quotidienne à `03h30`, juste après la fermeture du restaurant à `02h00`) :

```bash
sudo chmod +x /var/www/bmc/deploy/backup.sh
sudo cp /var/www/bmc/deploy/bmc-backup.service /etc/systemd/system/
sudo cp /var/www/bmc/deploy/bmc-backup.timer /etc/systemd/system/
sudo systemctl daemon-reload
sudo systemctl enable --now bmc-backup.timer
sudo systemctl list-timers bmc-backup.timer
```

Tester immédiatement une première sauvegarde manuelle :
```bash
sudo bash /var/www/bmc/deploy/backup.sh
ls -lh /var/backups/bmc/
```

### Option B : Tâche cron (alternative)
Si vous préférez `cron`, ajoutez une ligne dans `sudo crontab -e` :
```cron
30 3 * * * /var/www/bmc/deploy/backup.sh >> /var/log/bmc-backup.log 2>&1
```

### Option authentification sans `.env` : fichier `~/.pgpass`
Si vous exécutez `pg_dump` / `psql` hors environnement systemd sans sourcer `/etc/bmc/backend.env`, créez `/root/.pgpass` (droits stricts `600`, sans quoi PostgreSQL l'ignore) :
```bash
# Format : hote:port:base:utilisateur:mot_de_passe
echo "127.0.0.1:5432:bmc_food:bmc_user:REMPLACER_PAR_MOT_DE_PASSE" | sudo tee /root/.pgpass > /dev/null
sudo chmod 600 /root/.pgpass
```

---

## 2. Copie hors du serveur (obligatoire contre une panne disque)

Une sauvegarde stockée uniquement sur le même VPS est perdue si le disque ou l'hébergeur tombe. Copiez l'archive vers un stockage distant chaque nuit (décommentez la commande adaptée à la fin de [`deploy/backup.sh`](../deploy/backup.sh)) :

- **Via `rclone`** (vers S3, Backblaze B2, Google Drive…) :
  ```bash
  rclone copy /var/backups/bmc/ bmc-remote:bmc-backups/postgres/ --max-age 24h
  ```
- **Via `scp`** (vers un deuxième serveur ou PC d'administration avec clé SSH) :
  ```bash
  scp -i /root/.ssh/id_backup_ed25519 /var/backups/bmc/bmc_food_*.sql.gz backup@autre-serveur.exemple:/srv/backups/bmc/
  ```

---

## 3. Tester la procédure de restauration (sans toucher à la production)

La restauration doit être vérifiée périodiquement sur une base temporaire. Ces **3 commandes** testent l'intégrité complète d'une archive sur une base isolée `bmc_restore_test` (avec authentification via `.pgpass` ou `PGPASSWORD`) :

```bash
# 1. Créer une base de test vierge appartenant à bmc_user
sudo -u postgres createdb -O bmc_user bmc_restore_test

# 2. Restaurer la sauvegarde choisie dans cette base de test
gunzip -c /var/backups/bmc/bmc_food_YYYYMMDD_HHMMSS.sql.gz | psql -h 127.0.0.1 -U bmc_user -d bmc_restore_test -v ON_ERROR_STOP=1

# 3. Vérifier que les tables et données métier sont présentes (puis supprimer la base de test)
psql -h 127.0.0.1 -U bmc_user -d bmc_restore_test -c "SELECT COUNT(*) AS articles FROM api_menuitem; SELECT COUNT(*) AS commandes FROM api_order;"
```

*(Pour nettoyer après validation : `sudo -u postgres dropdb bmc_restore_test`.)*

---

## 4. Restauration d'urgence sur la base de production (`bmc_food`)

> **Attention** : cette opération remplace les données actuelles de la base `bmc_food` par le contenu de l'archive choisie.

```bash
# 1. Arrêter l'API pour éviter toute écriture concurrente pendant la restauration
sudo systemctl stop bmc-backend

# 2. Sauvegarder l'état cassé au cas où (facultatif mais conseillé)
sudo -u postgres pg_dump bmc_food | gzip > /var/backups/bmc/avant_restauration_$(date +%Y%m%d_%H%M%S).sql.gz

# 3. Restaurer l'archive validée dans la base de production
set -a && source /etc/bmc/backend.env && set +a
gunzip -c /var/backups/bmc/bmc_food_YYYYMMDD_HHMMSS.sql.gz | psql "$DATABASE_URL" -v ON_ERROR_STOP=1

# 4. Appliquer d'éventuelles migrations récentes et redémarrer le service
sudo -u bmc bash -c 'set -a && source /etc/bmc/backend.env && set +a && cd /var/www/bmc/backend && /var/www/bmc/venv/bin/python manage.py migrate --noinput'
sudo systemctl start bmc-backend
```

### Vérifier que la restauration a fonctionné
1. **Comptage des enregistrements** :
   ```bash
   psql "$DATABASE_URL" -c "SELECT COUNT(*) AS categories FROM api_category; SELECT COUNT(*) AS articles FROM api_menuitem; SELECT COUNT(*) AS commandes FROM api_order;"
   ```
2. **Santé de l'API** :
   ```bash
   curl -fsS https://bmcfood.sn/api/health/
   ```
3. Vérifiez dans `https://admin.bmcfood.sn` que l'historique des dernières commandes et le Plat du Jour correspondent bien à la sauvegarde restaurée.
