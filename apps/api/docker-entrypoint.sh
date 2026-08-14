#!/bin/sh
set -e

echo "Running migrations and seed as database admin..."
DB_USER="${DB_ADMIN_USER:-postgres}" \
DB_PASSWORD="${DB_ADMIN_PASSWORD:-postgres}" \
node dist/database/seed.js

echo "Starting API as ${DB_USER:-policy_app}..."
exec node dist/main.js
