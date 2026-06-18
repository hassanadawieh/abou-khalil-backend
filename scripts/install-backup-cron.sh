#!/bin/sh
set -eu

SCRIPT_DIR="$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)"
BACKUP_SCRIPT="$SCRIPT_DIR/backup-db.sh"
CRON_SCHEDULE="${CRON_SCHEDULE:-0 1 * * *}"

chmod +x "$BACKUP_SCRIPT"

CRON_LINE="$CRON_SCHEDULE $BACKUP_SCRIPT"

if crontab -l 2>/dev/null | grep -Fq "$BACKUP_SCRIPT"; then
  echo "Cron job already installed for:"
  echo "  $BACKUP_SCRIPT"
  crontab -l | grep "$BACKUP_SCRIPT"
  exit 0
fi

(
  crontab -l 2>/dev/null || true
  echo "$CRON_LINE"
) | crontab -

echo "Installed daily backup cron job:"
echo "  $CRON_LINE"
echo ""
echo "Backups will be saved to:"
echo "  $(dirname "$SCRIPT_DIR")/backups/abk_db_latest.sql.gz"
echo ""
echo "Log file:"
echo "  $(dirname "$SCRIPT_DIR")/backups/backup.log"
