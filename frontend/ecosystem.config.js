module.exports = {
  apps: [{
    name: "zion-frontend",
    script: "./server.js",
    instances: 1, // Reduzindo para 1 instância para debug
    exec_mode: "fork", // Mudando para fork mode para debug
    autorestart: true,
    watch: false,
    max_memory_restart: "1G",
    env: {
      NODE_ENV: "development",
      PORT: 3000,
      DEBUG: "*"
    },
    env_production: {
      NODE_ENV: "production",
      PORT: 3000
    },
    error_file: "./logs/err.log",
    out_file: "./logs/out.log",
    log_file: "./logs/combined.log",
    time: true,
    merge_logs: true,
    wait_ready: true,
    kill_timeout: 3000,
    max_restarts: 10,
    restart_delay: 4000,
    exp_backoff_restart_delay: 100
  }]
}; 