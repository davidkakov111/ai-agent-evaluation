#!/bin/sh
set -eu

DATA_DIR="/app/prisma/data"

mkdir -p "$DATA_DIR"

if [ "$(id -u)" = "0" ]; then
  chown -R nextjs:nodejs "$DATA_DIR"

  exec su-exec nextjs:nodejs sh -eu -c '
    npx prisma migrate deploy &&
    exec npm run start
  '
fi

npx prisma migrate deploy &&
exec npm run start
