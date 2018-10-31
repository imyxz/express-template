const mods = {
  'development': './configs/config.development.js'
}
const env = {

}
module.exports = () => {
  let mod = process.argv[2]
  let Config
  if (mod === 'env') {
    const target = process.env.NODE_ENV
    if (env.hasOwnProperty(target)) {
      Config = require(env[target])
    } else {
      throw new Error('Not have target env:' + target)
    }
  } else {
    if (mods.hasOwnProperty(mod)) {
      Config = require(mods[mod])
    } else {
      throw new Error('Not have target mod:' + mod)
    }
  }
  return Config
}
