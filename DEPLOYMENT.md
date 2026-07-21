# Timesheet Production Deployment

The production service runs as one PM2 fork on `127.0.0.1:3001` and is exposed by Nginx at `https://2startup.cloud/timesheet`.

## 1. Security Preflight

- Confirm the Git remote is SSH: `git remote -v`.
- Confirm GitHub authentication: `ssh -T git@github.com`.
- Connect to production with an SSH key, not a password or personal access token.
- Confirm `.env`, SQLite databases, uploads and backups are not tracked by Git.
- Rotate any credential that has previously been exposed.
- Record the current release: `git rev-parse HEAD`.

## 2. Runtime Directories

```bash
install -d -m 0750 /var/lib/2startup/timesheet
install -d -m 0750 /var/lib/2startup/timesheet/profile-images
install -d -m 0700 /var/backups/2startup/timesheet
chown -R <app-user>:<app-user> /var/lib/2startup/timesheet
```

Run the Timesheet PM2 daemon as `<app-user>` (a non-root service account). Use the same account for builds, migrations, and runtime file ownership.

Store runtime variables outside the repository and restrict the file to `0600`:

```env
NODE_ENV=production
PORT=3001
HOSTNAME=127.0.0.1
NEXTAUTH_URL=https://2startup.cloud/timesheet/api/auth
NEXTAUTH_SECRET=<at-least-32-random-bytes>
DATABASE_URL=file:/var/lib/2startup/timesheet/timesheet.db
PROFILE_IMAGE_DIR=/var/lib/2startup/timesheet/profile-images
```

Generate the secret with `openssl rand -base64 48`. Load this environment before invoking PM2; never put its value in Git or shell history.

## 3. Build Gate

Run these checks in the local repository before pushing:

```bash
npm ci --include=dev
npx prisma validate
npm run lint
npm test
npm run security:audit
npm run build
npm run smoke:standalone
```

The deployment is blocked by test/build errors or high/critical production dependency findings.
The permanent Playwright suite includes the mandatory password-change and session-revocation flow.

Authenticated Playwright tests require `E2E_ADMIN_PASSWORD` to be supplied through a hidden prompt and use the auth endpoint URL, not the site root:

```bash
read -rsp "E2E admin password: " E2E_ADMIN_PASSWORD && echo
export E2E_ADMIN_PASSWORD
NEXTAUTH_URL=http://localhost:3001/timesheet/api/auth \
TEST_BASE_URL=http://localhost:3001/timesheet \
npm run test:e2e
unset E2E_ADMIN_PASSWORD
```

For isolated CI runs, copy a non-production fixture database to a temporary path containing `timesheet-e2e`, set `E2E_ALLOW_DB_RESET=true`, and run `npm run test:e2e:prepare`. The preparation script refuses any other database path.

## 4. Production Deployment

Use `--ff-only` so production cannot create an accidental merge commit:

```bash
cd /var/www/apps/timesheet
set -a
source /etc/2startup/timesheet.env
set +a
git fetch --prune origin
git switch main
git pull --ff-only origin main
npm ci --include=dev
npx prisma generate
npm run lint
npm test
npm run build
TIMESHEET_DB_PATH=/var/lib/2startup/timesheet/timesheet.db npm run db:backup
npx prisma migrate deploy
# This migration forces accounts created before the strong-password policy to
# change their password once. Do not bypass the profile password-change screen.
pm2 restart ecosystem.config.cjs --only timesheet --update-env
pm2 save
```

Never run `prisma db push` or `prisma db seed` on production.

## 5. Post-deployment Verification

```bash
curl --fail http://127.0.0.1:3001/timesheet/api/health/
curl --fail --head https://2startup.cloud/timesheet/login/
pm2 status timesheet
pm2 logs timesheet --lines 100 --nostream
nginx -t
ss -ltnp | grep 3001
```

The health response must report `database: ok`, `profileStorage: ok`, and a non-zero `diskFreeBytes` value. Configure `pm2-logrotate` and verify its retention after the first restart.

Verify that the other PM2 applications and their health endpoints remain healthy. The Timesheet process must listen only on `127.0.0.1:3001`.

## 6. Backup and Restore Drill

Install `sqlite3`, then schedule `scripts/backup-production.sh` daily. The script uses SQLite's online backup command, includes profile images, writes checksums and removes archives older than 30 days.

```bash
TIMESHEET_DB_PATH=/var/lib/2startup/timesheet/timesheet.db \
PROFILE_IMAGE_DIR=/var/lib/2startup/timesheet/profile-images \
TIMESHEET_BACKUP_DIR=/var/backups/2startup/timesheet \
npm run db:backup
```

Run a non-destructive restore drill at least monthly:

```bash
npm run db:restore-drill -- /var/backups/2startup/timesheet/timesheet-<timestamp>.tar.gz
```

Copy encrypted backups off-server and monitor backup age and disk usage.

## 7. Rollback

1. Stop only the Timesheet process: `pm2 stop timesheet`.
2. Switch the checkout to the recorded previous release SHA.
3. Run `npm ci --include=dev`, `npx prisma generate` and `npm run build`.
4. Restore the database only when a migration is not backward compatible and the maintenance window has been approved.
5. Start only Timesheet and repeat all health checks.

Do not roll back or restart EQInfo, Roomie, PowerTrace, SignMeeting, DiviRadar, AppFund or other PM2 services during this procedure.
