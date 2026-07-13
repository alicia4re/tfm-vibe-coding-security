#!/bin/sh
set -e

# Push the Prisma schema to the SQLite database (creates the file/tables on
# first run; safe to re-run on every container start since it's idempotent).
npx prisma db push --skip-generate --accept-data-loss

exec "$@"
