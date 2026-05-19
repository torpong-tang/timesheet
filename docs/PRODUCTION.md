# Timesheet Production Notes

## SQLite

Use a persistent database path outside the application checkout:

```env
DATABASE_URL="file:/var/lib/2startup/timesheet/timesheet.db"
```

Create the directory before starting the app:

```bash
mkdir -p /var/lib/2startup/timesheet
chown -R <app-user>:<app-user> /var/lib/2startup/timesheet
```

Run only one PM2 instance while using SQLite. Do not use PM2 cluster mode for this app unless the database is moved to Postgres.

## PM2

Build the app and start the standalone server:

```bash
npm ci
npx prisma generate
npx prisma db push
npm run build
pm2 start ecosystem.config.cjs --update-env
pm2 save
```

The internal production port is `3001`. Nginx should proxy `/timesheet` to `http://127.0.0.1:3001`.
