module.exports = {
  apps: [
    {
      name: 'timesheet',
      cwd: '/var/www/apps/timesheet',
      script: '.next/standalone/server.js',
      instances: 1,
      exec_mode: 'fork',
      autorestart: true,
      max_memory_restart: '512M',
      kill_timeout: 10000,
      listen_timeout: 10000,
      time: true,
      env: {
        NODE_ENV: 'production',
        PORT: '3001',
        HOSTNAME: '127.0.0.1',
        DATABASE_URL: 'file:/var/lib/2startup/timesheet/timesheet.db',
        PROFILE_IMAGE_DIR: '/var/lib/2startup/timesheet/profile-images',
        NEXTAUTH_URL: process.env.NEXTAUTH_URL,
        NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET,
      },
    },
  ],
};
