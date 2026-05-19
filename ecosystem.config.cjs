module.exports = {
  apps: [
    {
      name: 'timesheet',
      cwd: '/var/www/apps/timesheet',
      script: '.next/standalone/server.js',
      instances: 1,
      exec_mode: 'fork',
      env: {
        NODE_ENV: 'production',
        PORT: '3001',
        HOSTNAME: '127.0.0.1',
        DATABASE_URL: 'file:/var/lib/2startup/timesheet/timesheet.db',
      },
    },
  ],
};
