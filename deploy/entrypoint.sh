#!/bin/sh
set -eu

python manage.py collectstatic --noinput

if [ "${RUN_MIGRATIONS:-1}" = "1" ]; then
  python manage.py migrate --noinput
fi

if [ "${LOAD_DEV_SEED:-0}" = "1" ]; then
  python manage.py loaddata caseman_dev_seed
fi

exec "$@"
