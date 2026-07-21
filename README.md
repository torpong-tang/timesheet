# Timesheet

Internal project timesheet application built with Next.js 16, NextAuth, Prisma, SQLite and shadcn/ui.

## Features

- Role-based access for `ADMIN`, `GM`, `PM` and `DEV`
- Project assignments enforced by server actions
- Daily and recurring time entry with monthly lock and seven-hour daily limit
- Team dashboards and Excel reports scoped by role and project
- User, project, holiday, assignment and audit administration
- Persistent profile-image storage with authenticated delivery

## Local Development

```bash
cp .env.production.example .env
# Change DATABASE_URL to file:./dev.db and set a local NEXTAUTH_SECRET.
npm ci
npx prisma generate
npx prisma migrate deploy
npm run dev
```

Open `http://localhost:3001/timesheet/login/`.

Demo data is opt-in and must never be used against production:

```bash
ALLOW_DEMO_SEED=true DEMO_PASSWORD='<strong-local-password>' npx prisma db seed
```

## Quality Checks

```bash
npm run lint
npm test
npm run test:coverage
npm run build
npm run security:audit
```

Playwright tests mutate data and must use an isolated test database:

```bash
read -rsp "E2E admin password: " E2E_ADMIN_PASSWORD && echo
export E2E_ADMIN_PASSWORD
NEXTAUTH_URL=http://localhost:3001/timesheet/api/auth \
TEST_BASE_URL=http://localhost:3001/timesheet \
npm run test:e2e
unset E2E_ADMIN_PASSWORD
```

Never place the E2E password in source code, `.env`, command history, or a committed Playwright artifact.

## Production

Do not run the demo seed against production. Runtime secrets, SQLite data, profile images and backups must remain outside the Git checkout.

See [DEPLOYMENT.md](./DEPLOYMENT.md) for the deployment, backup, restore-drill and rollback runbook.
