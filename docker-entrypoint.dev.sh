#!/bin/sh
set -e

# Named volume for node_modules starts empty and would hide image deps.
if [ ! -d node_modules/next ]; then
  echo "Installing npm dependencies into container volume..."
  npm ci
fi

exec "$@"
