const Sequelize = require('sequelize')
const fs = require('fs-extra')
const path = require('path')
const chokidar = require('chokidar')
const mockRequire = require('./mock-require')
let sequelize
let definitions
let models
let Logger = () => {}

function ConnectDB ({ db_name,
  username,
  password,
  host }) {
  let Op = Sequelize.Op
  const operatorsAliases = {
    $eq: Op.eq,
    $ne: Op.ne,
    $gte: Op.gte,
    $gt: Op.gt,
    $lte: Op.lte,
    $lt: Op.lt,
    $not: Op.not,
    $in: Op.in,
    $notIn: Op.notIn,
    $is: Op.is,
    $like: Op.like,
    $notLike: Op.notLike,
    $iLike: Op.iLike,
    $notILike: Op.notILike,
    $regexp: Op.regexp,
    $notRegexp: Op.notRegexp,
    $iRegexp: Op.iRegexp,
    $notIRegexp: Op.notIRegexp,
    $between: Op.between,
    $notBetween: Op.notBetween,
    $overlap: Op.overlap,
    $contains: Op.contains,
    $contained: Op.contained,
    $adjacent: Op.adjacent,
    $strictLeft: Op.strictLeft,
    $strictRight: Op.strictRight,
    $noExtendRight: Op.noExtendRight,
    $noExtendLeft: Op.noExtendLeft,
    $and: Op.and,
    $or: Op.or,
    $any: Op.any,
    $all: Op.all,
    $values: Op.values,
    $col: Op.col
  }
  return new Sequelize(db_name, username, password, {
    host: host,
    dialect: 'mysql',
    logging: Logger,
    operatorsAliases
  })
}

async function LoadAssociation (dir, _definitions) {
  let ret = {}
  let list = await fs.readdir(dir)
  list.filter(e => {
    return path.extname(e) === '.js'
  }).forEach(e => {
    let func = require(path.resolve(dir, e))
    func(_definitions)
    console.info(`Load association in ${path.basename(e)} done.`)
  })
}
async function LoadDefinition (dir, _sequelize, alter_changed = false) {
  let _definitions = {}
  let list = await fs.readdir(dir)
  list.filter(e => {
    return path.extname(e) === '.js'
  }).forEach(e => {
    let name = path.basename(e, '.js')
    console.info(`Loading definition ${name}...`)
    _definitions[name] = _sequelize.import(path.resolve(dir, e))
  })
  await LoadAssociation(path.resolve(dir, 'Association'), _definitions)
  await _sequelize.sync({
    alter: alter_changed
  }).then(e => {
    console.info('Sync database done.')
  })
  return _definitions
}
async function LoadModel (dir, _definitions) {
  let ret = {}
  let list = await fs.readdir(dir)
  list.filter(e => {
    return path.extname(e) === '.js'
  }).forEach(e => {
    let name = path.basename(e, '.js')
    let factory = require(path.resolve(dir, e))
    ret[name] = factory(_definitions)

    console.info(`Load model ${name} done.`)
  })
  return ret
}

function dynamicReloadModel (modelpath, _models, _definitions) {
  let name = path.basename(modelpath, '.js')
  mockRequire.cleanRequireCache(modelpath)
  if (fs.existsSync(modelpath)) {
    let factory = require(modelpath)
    let model = factory(_definitions)
    _models[name] = model
  } else {
    _models[name] = null
  }
}

function AddHotSwappingForModels (dir, _models, _definitions) {
  let watcher = chokidar.watch(dir, {
    persistent: true,
    ignoreInitial: true,
    depth: 0
  })
  watcher.on('all', (event, filepath) => {
    if (path.extname(filepath) === '.js') {
      console.info(`Updating Model ${filepath}...`)
      try {
        dynamicReloadModel(filepath, _models, _definitions)
        console.info('Done!')
      } catch (e) {
        console.error(`Error while updating ${filepath}`)
        console.error(e)
      }
    }
  })
}
let context
module.exports = async function (Config) {
  if (context) {
    return context
  }
  if (Config === undefined) {
    throw new Error('Config need to be specified.')
  }
  let DBConfig = Config.database
  if (Config.dev.showDBLog === true) { Logger = (e) => console.log(e) }
  sequelize = ConnectDB(DBConfig)
  definitions = await LoadDefinition(path.resolve(__dirname, '../src', 'Model', 'Definition'), sequelize, DBConfig.auto_alter_db === true)
  models = await LoadModel(path.resolve(__dirname, '../src', 'Model'), definitions)
  if (Config.dev.hotSwap === true) { AddHotSwappingForModels(path.resolve(__dirname, '../src', 'Model'), models, definitions) }
  context = {
    sequelize,
    definitions,
    models
  }
  return context
}
