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
exec "$@"
