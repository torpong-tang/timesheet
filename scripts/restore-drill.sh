#!/usr/bin/env bash
set -euo pipefail

ARCHIVE="${1:-}"
if [[ -z "$ARCHIVE" || ! -f "$ARCHIVE" ]]; then
  echo "Usage: $0 /path/to/timesheet-backup.tar.gz" >&2
  exit 1
fi

command -v sqlite3 >/dev/null || { echo "sqlite3 is required" >&2; exit 1; }
WORK_DIR="$(mktemp -d "${TMPDIR:-/tmp}/timesheet-restore-drill.XXXXXX")"
cleanup() { rm -rf -- "$WORK_DIR"; }
trap cleanup EXIT

tar -xzf "$ARCHIVE" -C "$WORK_DIR"
(
  cd "$WORK_DIR"
  sha256sum -c SHA256SUMS
)
sqlite3 "$WORK_DIR/timesheet.db" "PRAGMA integrity_check;" | grep -qx "ok"
sqlite3 "$WORK_DIR/timesheet.db" "SELECT 'users=' || COUNT(*) FROM User; SELECT 'entries=' || COUNT(*) FROM TimesheetEntry;"

echo "Restore drill passed; production data was not modified."
