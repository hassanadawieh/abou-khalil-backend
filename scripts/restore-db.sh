#!/bin/sh
set -eu

SCRIPT_DIR="$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"
ENV_FILE="${ENV_FILE:-$PROJECT_DIR/.env}"
BACKUP_DIR="${BACKUP_DIR:-$PROJECT_DIR/backups}"
CONTAINER_NAME="${DB_CONTAINER:-abk-postgres}"
BACKUP_FILE="${1:-$BACKUP_DIR/abk_db_latest.sql.gz}"

if [ ! -f "$ENV_FILE" ]; then
  echo "Missing .env file: $ENV_FILE"
  exit 1
fi

if [ ! -f "$BACKUP_FILE" ]; then
  echo "Backup file not found: $BACKUP_FILE"
  exit 1
fi

# shellcheck disable=SC1090
set -a
. "$ENV_FILE"
set +a

DB_USERNAME="${DB_USERNAME:-postgres}"
DB_PASSWORD="${DB_PASSWORD:-postgres}"
DB_NAME="${DB_NAME:-abk_db}"

echo "WARNING: This will overwrite database '$DB_NAME'."
printf "Type RESTORE to continue: "
read -r CONFIRM

if [ "$CONFIRM" != "RESTORE" ]; then
  echo "Restore cancelled."
  exit 1
fi

gunzip -c "$BACKUP_FILE" | docker exec -i -e PGPASSWORD="$DB_PASSWORD" "$CONTAINER_NAME" \
  psql -U "$DB_USERNAME" -d "$DB_NAME"

echo "Restore completed from: $BACKUP_FILE"
