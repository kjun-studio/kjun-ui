#!/bin/sh
set -eu
cd "$(dirname "$0")/.."
if docker container inspect kjun_ui_dev >/dev/null 2>&1; then
  docker start kjun_ui_dev >/dev/null
else
  docker compose up -d dev
fi
# Browser binaries live in a named volume; their system libraries live in the container.
if ! docker exec kjun_ui_dev dpkg -s libnss3 >/dev/null 2>&1; then
  docker exec kjun_ui_dev npm run setup:browsers
fi
if curl -fsS http://127.0.0.1:4173/ -o /dev/null 2>/dev/null; then
  echo "KJUN UI: http://127.0.0.1:4173"
  exit 0
fi
if ! docker exec kjun_ui_dev test -f /workspace/apps/docs/public/previews/vue2.html; then
  docker exec kjun_ui_dev npm run setup
fi
docker exec -it -w /workspace/apps/docs kjun_ui_dev npm run dev -- --port 4173

