#!/bin/sh
set -e

echo "Entrypoint: NODE_ENV=${NODE_ENV} SKIP_DB_WAIT=${SKIP_DB_WAIT} RUN_MIGRATIONS=${RUN_MIGRATIONS}"

# if you run a managed DB and migrations already applied in CI, set SKIP_DB_WAIT=true and RUN_MIGRATIONS=false
if [ "$RUN_MIGRATIONS" = "true" ]; then
    echo "Running prisma migrate deploy..."
    npx prisma migrate deploy
fi

exec "$@"