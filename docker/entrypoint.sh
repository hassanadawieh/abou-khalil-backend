#!/bin/sh
set -e

host="${DB_HOST:-db}"
port="${DB_PORT:-5432}"
db_user="${DB_USERNAME:-postgres}"
db_name="${DB_NAME:-abk_db}"

echo "Waiting for PostgreSQL at ${host}:${port}..."

until node -e "
const net = require('net');
const socket = net.createConnection(
  { host: process.env.DB_HOST || 'db', port: Number(process.env.DB_PORT || 5432) },
  () => { socket.end(); process.exit(0); },
);
socket.on('error', () => process.exit(1));
setTimeout(() => process.exit(1), 2000);
" 2>/dev/null; do
  sleep 2
done

echo "PostgreSQL is ready."

if [ -f /app/scripts/fix-schema.sql ]; then
  echo "Applying safe schema fixes..."
  PGPASSWORD="${DB_PASSWORD:-postgres}" psql \
    -h "${host}" \
    -p "${port}" \
    -U "${db_user}" \
    -d "${db_name}" \
    -v ON_ERROR_STOP=1 \
    -f /app/scripts/fix-schema.sql
  echo "Schema fixes applied."
fi

exec "$@"
