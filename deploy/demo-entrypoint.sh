#!/bin/sh
set -e

PORT="${PORT:-8080}"
rm -f /etc/nginx/http.d/*.conf
sed "s/LISTEN_PORT/${PORT}/g" /etc/nginx/demo.conf.template > /etc/nginx/http.d/default.conf

echo "Running migrations and seed..."
DB_USER="${DB_ADMIN_USER:-$DB_USER}" \
DB_PASSWORD="${DB_ADMIN_PASSWORD:-$DB_PASSWORD}" \
node dist/database/seed.js

echo "Starting API on 3000 and nginx on ${PORT}..."
node dist/main.js &
nginx -g "daemon off;"
