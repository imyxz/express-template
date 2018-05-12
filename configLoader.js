module.exports = () => {
  let mod = process.argv[2]
  let Config
  if(mod === 'development')
    Config = require('./config.development.js')
  else if(mod === 'production')
    Config = require('./config.production.js')
  return Config
}