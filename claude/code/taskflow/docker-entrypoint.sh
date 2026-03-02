#!/bin/sh
set -e

echo "Running Prisma migrations..."
NODE_PATH=/prisma-cli/node_modules node /prisma-cli/node_modules/prisma/build/index.js migrate deploy
echo "Migrations complete."

echo "Starting Next.js server..."
exec node server.js
