#!/usr/bin/env bash
# Construit les deux applications frontales pour la production (client_website et admin_app).
# En architecture reverse proxy Caddy sur le même domaine/sous-domaine, l'API reste en chemin
# relatif (/api) afin d'éviter tout besoin de CORS (voir docs/deploiement_api_reverse_proxy.md).

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
export VITE_API_BASE_URL="${VITE_API_BASE_URL:-/api}"

echo "[1/2] Construction du site client (VITE_API_BASE_URL=${VITE_API_BASE_URL})..."
cd "${ROOT_DIR}/client_website"
npm ci
npm run build

echo "[2/2] Construction de l'application admin/KDS (VITE_API_BASE_URL=${VITE_API_BASE_URL})..."
cd "${ROOT_DIR}/admin_app"
npm ci
npm run build

echo "Terminé : builds disponibles dans client_website/dist et admin_app/dist."
