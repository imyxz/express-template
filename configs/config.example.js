module.exports = {
  server: {
    port: 3876,
    prefix: '/',
    route_dir: 'src/Route'
  },
  database: {
    username: '',
    password: '',
    host: '',
    db_name: ''
  },
  env: {
    JWTKEY: ''
  },
  dev: {
    hotSwap: true,
    showDBLog: true
  }
}
