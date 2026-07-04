#!/bin/sh

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
  if PGPASSWORD="${DB_PASSWORD:-postgres}" psql \
    -h "${host}" \
    -p "${port}" \
    -U "${db_user}" \
    -d "${db_name}" \
    -v ON_ERROR_STOP=0 \
    -f /app/scripts/fix-schema.sql; then
    echo "Schema fixes applied."
  else
    echo "WARNING: schema fix script reported errors (continuing startup)."
  fi
else
  echo "WARNING: /app/scripts/fix-schema.sql not found."
fi

echo "Starting API (TypeORM synchronize is disabled)..."
exec "$@"
