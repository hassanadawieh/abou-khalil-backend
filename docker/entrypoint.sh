#!/bin/sh
set -e

host="${DB_HOST:-db}"
port="${DB_PORT:-5432}"

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
  echo "Applying database schema fixes..."
  PGPASSWORD="${DB_PASSWORD}" psql \
    -h "${host}" \
    -p "${port}" \
    -U "${DB_USERNAME:-postgres}" \
    -d "${DB_NAME:-abk_db}" \
    -v ON_ERROR_STOP=0 \
    -f /app/scripts/fix-schema.sql \
    || echo "Warning: some schema fix statements failed (see above)."
fi

exec "$@"
