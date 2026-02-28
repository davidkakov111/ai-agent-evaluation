#!/bin/sh
set -e

# Require NEXTAUTH_SECRET in production
if [ -z "${NEXTAUTH_SECRET}" ]; then
  echo "Error: NEXTAUTH_SECRET must be set. Add it to your .env file."
  echo "Example: NEXTAUTH_SECRET=$(openssl rand -base64 32 2>/dev/null || echo 'your-secret-at-least-32-chars')"
  exit 1
fi

# Ensure data directory exists and is writable
mkdir -p /app/data

# Run Prisma migrations (from app directory so prisma.config.ts is found)
cd /app
echo "Running database migrations..."
node node_modules/prisma/build/index.js migrate deploy

# Execute the main command
exec "$@"
