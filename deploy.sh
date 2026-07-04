#!/bin/sh
set -e

echo "==> ABK API — clean Docker deployment"
echo ""

if [ ! -f .env ]; then
  echo "Creating .env from .env.example..."
  cp .env.example .env
  echo ""
  echo "IMPORTANT: Edit .env and set a strong DB_PASSWORD before production use."
  echo "  nano .env"
  echo ""
fi

echo "==> Stopping containers and REMOVING database volume..."
docker compose down -v

echo ""
echo "==> Building images (no cache)..."
docker compose build --no-cache

echo ""
echo "==> Starting database + API..."
docker compose up -d

echo ""
echo "==> Waiting for API to become healthy..."
i=0
until curl -fsS "http://127.0.0.1:${PORT:-6000}/docs" >/dev/null 2>&1; do
  i=$((i + 1))
  if [ "$i" -gt 60 ]; then
    echo "API did not start in time. Logs:"
    docker compose logs --tail=100 api
    exit 1
  fi
  sleep 2
done

echo ""
echo "==> Seeding roles, permissions, and admin user..."
docker compose --profile seed run --rm seed

echo ""
echo "Deployment complete."
echo ""
echo "  API:     http://$(hostname -I 2>/dev/null | awk '{print $1}'):${PORT:-6000}"
echo "  Swagger: http://$(hostname -I 2>/dev/null | awk '{print $1}'):${PORT:-6000}/docs"
echo ""
echo "  Login:"
echo "    username: ${SEED_ADMIN_USERNAME:-hassan}"
echo "    password: ${SEED_ADMIN_PASSWORD:-P@ssw0rd}"
echo ""
echo "Useful commands:"
echo "  docker compose logs -f api"
echo "  docker compose ps"
