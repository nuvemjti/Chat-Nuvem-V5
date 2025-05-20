module.exports = [{
  script: 'dist/server.js',
  name: 'zion-backend',
  exec_mode: 'fork',
  instances: 1,
  autorestart: true,
  watch: false,
  max_memory_restart: '1G',
  env: {
    NODE_ENV: 'development',
    PORT: 3333,
    DEBUG: '*'
  },
  env_production: {
    NODE_ENV: 'production',
    PORT: 3333
  },
  error_file: './logs/err.log',
  out_file: './logs/out.log',
  log_file: './logs/combined.log',
  time: true,
  merge_logs: true,
  wait_ready: true,
  kill_timeout: 3000,
  max_restarts: 10,
  restart_delay: 4000,
  exp_backoff_restart_delay: 100,
  node_args: '--max-old-space-size=1024'
}]