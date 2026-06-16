#!/bin/sh
set -e

echo "==> ABK API — Docker deployment"
echo ""

if [ ! -f .env ]; then
  echo "Creating .env from .env.example..."
  cp .env.example .env
  echo ""
  echo "IMPORTANT: Edit .env and set a strong DB_PASSWORD before production use."
  echo "  nano .env"
  echo ""
fi

echo "==> Building and starting containers..."
docker compose up -d --build

echo ""
echo "==> Waiting for API to be ready..."
sleep 5

echo ""
echo "==> Seeding roles and permissions..."
docker compose --profile seed run --rm seed

echo ""
echo "Deployment complete."
echo ""
echo "  API:     http://$(hostname -I 2>/dev/null | awk '{print $1}'):${PORT:-6000}"
echo "  Swagger: http://$(hostname -I 2>/dev/null | awk '{print $1}'):${PORT:-6000}/api/docs"
echo ""
echo "Useful commands:"
echo "  docker compose logs -f api    # View logs"
echo "  docker compose ps             # Check status"
echo "  docker compose down           # Stop all"
