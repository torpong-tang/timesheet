# Production Architecture Notes

The canonical operational runbook is [DEPLOYMENT.md](../DEPLOYMENT.md).

## Runtime Constraints

- SQLite database: `/var/lib/2startup/timesheet/timesheet.db`
- Profile images: `/var/lib/2startup/timesheet/profile-images`
- Internal listener: `127.0.0.1:3001`
- Public base path: `/timesheet`
- PM2 mode: one fork instance only
- Schema changes: committed Prisma migrations and `prisma migrate deploy`
- Health endpoint: `/timesheet/api/health/`
- Session lifetime: 8 hours; password resets and password changes revoke all previous sessions.
- Existing accounts are forced through a one-time strong-password update by the session-security migration.
- PM2 must run under the dedicated application account that owns the runtime directories, never as an interactive deploy shell with broader privileges.

SQLite is suitable for the current workload while the service remains a single process. Move to PostgreSQL before introducing PM2 cluster mode, multiple application hosts or sustained concurrent writes.

## Reverse Proxy Security

Nginx must set `X-Forwarded-For`, `X-Real-IP`, and `X-Forwarded-Proto`, enforce HTTPS, and add HSTS at the TLS virtual host. Keep request bodies within the application's 3 MB limit and apply a login rate limit at Nginx in addition to the application guard.

## Operations

Install `pm2-logrotate` with retention appropriate to available disk space. Monitor PM2 restarts, health endpoint failures, free disk, SQLite database growth, and profile storage permissions. The health endpoint verifies both database connectivity and read/write access to profile storage.
