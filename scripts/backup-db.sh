#!/bin/sh
set -eu

# Daily PostgreSQL backup for Docker deployment.
# Keeps a single latest dump and removes the previous one.

SCRIPT_DIR="$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"
ENV_FILE="${ENV_FILE:-$PROJECT_DIR/.env}"
BACKUP_DIR="${BACKUP_DIR:-$PROJECT_DIR/backups}"
CONTAINER_NAME="${DB_CONTAINER:-abk-postgres}"
BACKUP_FILE="$BACKUP_DIR/abk_db_latest.sql.gz"
LOG_FILE="$BACKUP_DIR/backup.log"

log() {
  printf '[%s] %s\n' "$(date -u '+%Y-%m-%d %H:%M:%S UTC')" "$1" >> "$LOG_FILE"
}

mkdir -p "$BACKUP_DIR"

if [ -f "$ENV_FILE" ]; then
  # shellcheck disable=SC1090
  set -a
  . "$ENV_FILE"
  set +a
fi

DB_USERNAME="${DB_USERNAME:-postgres}"
DB_PASSWORD="${DB_PASSWORD:-postgres}"
DB_NAME="${DB_NAME:-abk_db}"

if ! docker ps --format '{{.Names}}' | grep -qx "$CONTAINER_NAME"; then
  log "ERROR: Container '$CONTAINER_NAME' is not running."
  exit 1
fi

log "Starting backup for database '$DB_NAME'..."

if [ -f "$BACKUP_FILE" ]; then
  rm -f "$BACKUP_FILE"
  log "Removed previous backup: $BACKUP_FILE"
fi

if docker exec -e PGPASSWORD="$DB_PASSWORD" "$CONTAINER_NAME" \
  pg_dump -U "$DB_USERNAME" -d "$DB_NAME" --no-owner --no-acl \
  | gzip > "$BACKUP_FILE"; then
  SIZE="$(du -h "$BACKUP_FILE" | cut -f1)"
  log "Backup completed: $BACKUP_FILE ($SIZE)"
else
  log "ERROR: Backup failed."
  rm -f "$BACKUP_FILE"
  exit 1
fi
