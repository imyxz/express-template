module.exports = {
  server: {
    port: 3876,
    prefix: '/',
    route_dir: 'src/Route'
  },
  database: {
    username: 'root',
    password: '',
    host: 'localhost',
    db_name: 'express'
  },
  env: {
    JWTKEY: ''
  },
  dev: {
    hotSwap: true,
    showDBLog: true
  }
}
