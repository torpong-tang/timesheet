#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
PORT="${SMOKE_PORT:-3011}"
LOG_FILE="${TMPDIR:-/tmp}/timesheet-standalone-smoke.log"

cd "$ROOT_DIR"
mkdir -p "${PROFILE_IMAGE_DIR:-/tmp/timesheet-profile-images}"

PORT="$PORT" \
HOSTNAME=127.0.0.1 \
DATABASE_URL="${DATABASE_URL:-file:${ROOT_DIR}/prisma/dev.db}" \
NEXTAUTH_URL="http://127.0.0.1:${PORT}/timesheet/api/auth" \
NEXTAUTH_SECRET="${NEXTAUTH_SECRET:-local-smoke-secret-that-is-not-for-production}" \
PROFILE_IMAGE_DIR="${PROFILE_IMAGE_DIR:-/tmp/timesheet-profile-images}" \
node .next/standalone/server.js >"$LOG_FILE" 2>&1 &
SERVER_PID=$!

cleanup() {
  kill "$SERVER_PID" 2>/dev/null || true
  wait "$SERVER_PID" 2>/dev/null || true
}
trap cleanup EXIT

for _ in {1..20}; do
  if curl --fail --silent "http://127.0.0.1:${PORT}/timesheet/api/health/" >/dev/null; then
    break
  fi
  sleep 1
done

curl --fail --silent --show-error "http://127.0.0.1:${PORT}/timesheet/api/health/"
echo
curl --silent --output /dev/null --write-out 'login=%{http_code}\n' "http://127.0.0.1:${PORT}/timesheet/login/"
curl --silent --output /dev/null --write-out 'dashboard=%{http_code} redirect=%{redirect_url}\n' "http://127.0.0.1:${PORT}/timesheet/dashboard/"
