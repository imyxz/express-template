module.exports = () => {
  let mod = process.argv[2]
  let Config
  if (mod === 'development') {
    Config = require('./configs/config.development.js')
  } else if (mod === 'production') {
    Config = require('./configs/config.production.js')
  }
  return Config
}
