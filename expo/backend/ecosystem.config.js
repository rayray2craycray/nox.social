/**
 * PM2 Process Manager Configuration
 * For production deployment with clustering and monitoring
 *
 * Usage:
 * pm2 start ecosystem.config.js --env production
 * pm2 logs
 * pm2 monit
 * pm2 reload nox-backend
 * pm2 stop nox-backend
 */

module.exports = {
  apps: [{
    // Application name
    name: 'nox-backend',

    // Entry point
    script: './src/server.js',

    // Instances (0 = CPU cores, or specify number)
    instances: process.env.PM2_INSTANCES || 'max',

    // Load balancing mode
    exec_mode: 'cluster',

    // Watch for file changes (disable in production)
    watch: false,

    // Maximum memory before restart
    max_memory_restart: '500M',

    // Environment variables for all environments
    env: {
      NODE_ENV: 'development',
      PORT: 5000,
    },

    // Production environment
    env_production: {
      NODE_ENV: 'production',
      PORT: 5000,
    },

    // Staging environment
    env_staging: {
      NODE_ENV: 'staging',
      PORT: 5000,
    },

    // Logging
    error_file: './logs/pm2-error.log',
    out_file: './logs/pm2-out.log',
    log_file: './logs/pm2-combined.log',
    time: true,
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z',

    // Restart strategies
    autorestart: true,
    max_restarts: 10,
    min_uptime: '10s',
    restart_delay: 4000,

    // Graceful shutdown
    kill_timeout: 5000,
    wait_ready: true,
    listen_timeout: 3000,

    // Source maps
    source_map_support: true,

    // Instance variables
    instance_var: 'INSTANCE_ID',

    // Merge logs from all instances
    merge_logs: true,

    // Auto restart on reaching memory limit
    max_memory_restart: '512M',

    // Cron restart (optional - restart at 3 AM daily)
    cron_restart: '0 3 * * *',

    // Exponential backoff restart delay
    exp_backoff_restart_delay: 100,
  }],

  // Deployment configuration
  deploy: {
    production: {
      user: 'deploy',
      host: ['your-production-server.com'],
      ref: 'origin/main',
      repo: 'git@github.com:your-repo/nox-social-app.git',
      path: '/var/www/nox-backend',
      'post-deploy': 'npm install && pm2 reload ecosystem.config.js --env production',
      'pre-deploy-local': '',
      'post-setup': 'npm install',
    },
    staging: {
      user: 'deploy',
      host: ['your-staging-server.com'],
      ref: 'origin/develop',
      repo: 'git@github.com:your-repo/nox-social-app.git',
      path: '/var/www/nox-backend-staging',
      'post-deploy': 'npm install && pm2 reload ecosystem.config.js --env staging',
    },
  },
};
