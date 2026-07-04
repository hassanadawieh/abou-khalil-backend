#!/bin/sh
set -eu

# Run from /var/www/abou-khalil-backend on the server.
# Fixes DB, rebuilds API image without cache, and starts the API.

echo "==> Repairing database schema..."
docker exec -i abk-postgres psql -U postgres -d abk_db < scripts/fix-schema.sql

echo "==> Rebuilding API image (no cache)..."
docker compose build --no-cache api

echo "==> Starting API..."
docker compose up -d api

echo "==> Waiting for API..."
sleep 5
docker compose ps
docker compose logs --tail=50 api

echo ""
echo "==> Testing /docs ..."
curl -i http://127.0.0.1:6000/docs || true
