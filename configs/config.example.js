module.exports = {
  server: {
    port: 3876,
    prefix: '/',
    route_dir: 'Route'
  },
  database: {
    username: '',
    password: '',
    host: '',
    db_name: '',
    auto_alter_db: true
  },
  env: {
    JWTKEY: ''
  },
  dev: {
    hotSwap: true,
    showDBLog: true
  },
  redis: {
    host: 'redis',
    port: 6379,
    db: 0,
    enable: false
  }
}
