const fs = require('fs-extra')
const path = require('path')
const chokidar = require('chokidar')
const Config = require('./configLoader')()
let module_cache = {}

function cleanRequireCache (modulePath) {
  // from http://fex.baidu.com/blog/2015/05/nodejs-hot-swapping/
  var _module = require.cache[modulePath]
  // remove reference in module.parent
  if (_module === undefined || _module === null) {
    return
  }
  if (_module.parent) {
    _module.parent.children.splice(_module.parent.children.indexOf(_module), 1)
  }
  require.cache[modulePath] = null
}
function syncObject (target, source) {
  Object.keys(target).forEach((key) => {
    if (source.hasOwnProperty(key) === false) delete target[key]
  })
  Object.keys(source).forEach((key) => {
    target[key] = source[key]
  })
  return target
}
/**
 * If the module you require only exports a object, you could use this to hot swap required module
 * @param {string} modulePath 
 */
function watchRequire (modulePath) {
  modulePath = resolvePath(modulePath)
  if (Config.dev.hotSwap === true) {
    if (module_cache[modulePath] === undefined) {
      module_cache[modulePath] = require(modulePath)
      let watcher = chokidar.watch(modulePath, {
        persistent: true,
        ignoreInitial: true
      })
      watcher.on('all', (event, filepath) => {
        cleanRequireCache(filepath)
        if (fs.existsSync(filepath) === true) {
          let newer = require(filepath)
          syncObject(module_cache[modulePath], newer)
        } else {
          syncObject(module_cache[modulePath], {})
        }
        console.info(`Updated module ${filepath}`)
      })
    }
    return module_cache[modulePath]
  } else { return require(modulePath) }
}
/**
 * Use to require a module. If first char of the modulePath is ~, it will be repalced with the root directory of the project.
 * @param {string} modulePath 
 */
function resolveRequire (modulePath) {
  return require(resolvePath(modulePath))
}
function resolvePath (filepath) {
  if (filepath.charAt(0) === '~') {
    filepath = filepath.substr(1)
    if (filepath.charAt(0) === '/') { filepath = filepath.substr(1) }
    filepath = path.join(filepath)
    filepath = path.resolve(__dirname, filepath)
  }
  return require.resolve(filepath)
}
module.exports = {
  cleanRequireCache,
  watchRequire,
  _require: resolveRequire
}
