#!/bin/sh
set -e

echo "Running migrations and seed..."
node dist/database/seed.js

echo "Starting API..."
exec node dist/main.js
