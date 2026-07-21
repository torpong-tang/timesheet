#!/usr/bin/env bash
set -euo pipefail

DB_PATH="${TIMESHEET_DB_PATH:-/var/lib/2startup/timesheet/timesheet.db}"
UPLOAD_DIR="${PROFILE_IMAGE_DIR:-/var/lib/2startup/timesheet/profile-images}"
BACKUP_ROOT="${TIMESHEET_BACKUP_DIR:-/var/backups/2startup/timesheet}"
RETENTION_DAYS="${TIMESHEET_BACKUP_RETENTION_DAYS:-30}"
STAMP="$(date -u +%Y%m%dT%H%M%SZ)"
WORK_DIR="$(mktemp -d "${TMPDIR:-/tmp}/timesheet-backup.XXXXXX")"
ARCHIVE="${BACKUP_ROOT}/timesheet-${STAMP}.tar.gz"

cleanup() {
  rm -rf -- "$WORK_DIR"
}
trap cleanup EXIT

command -v sqlite3 >/dev/null || { echo "sqlite3 is required" >&2; exit 1; }
test -f "$DB_PATH" || { echo "Database not found: $DB_PATH" >&2; exit 1; }

install -d -m 0700 "$BACKUP_ROOT"
sqlite3 "$DB_PATH" ".backup '$WORK_DIR/timesheet.db'"
sqlite3 "$WORK_DIR/timesheet.db" "PRAGMA integrity_check;" | grep -qx "ok"

if [[ -d "$UPLOAD_DIR" ]]; then
  cp -a -- "$UPLOAD_DIR" "$WORK_DIR/profile-images"
fi

(
  cd "$WORK_DIR"
  sha256sum timesheet.db > SHA256SUMS
  if [[ -d profile-images ]]; then
    find profile-images -type f -print0 | sort -z | xargs -0 -r sha256sum >> SHA256SUMS
  fi
)

tar -C "$WORK_DIR" -czf "$ARCHIVE" .
chmod 0600 "$ARCHIVE"
find "$BACKUP_ROOT" -maxdepth 1 -type f -name 'timesheet-*.tar.gz' -mtime "+$RETENTION_DAYS" -delete

echo "$ARCHIVE"
