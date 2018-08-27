const Sequelize = require('sequelize')
const fs = require('fs-extra')
const path = require('path');
const chokidar = require('chokidar');
const hotSwapping = require('./hotSwapping')
let sequelize;
let definitions;
let models;
let Logger = () => {};

function ConnectDB({
  db_name,
  username,
  password,
  host
}) {
  return new Sequelize(db_name, username, password, {
    host: host,
    dialect: 'mysql',
    logging: Logger
  })
}

async function LoadAssociation(dir, _definitions) {
  let ret = {}
  let list = await fs.readdir(dir)
  list.filter(e => {
    return path.extname(e) === '.js'
  }).forEach(e => {
    let func = require(path.resolve(dir, e));
    func(_definitions)
    console.info(`Load association in ${path.basename(e)} done.`)
  })
}
async function LoadDefinition(dir, _sequelize) {
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
  await _sequelize.sync().then(e => {
    console.info(`Sync database done.`)
  })
  return _definitions;
}
async function LoadModel(dir, _definitions) {
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
  return ret;
}

function dynamicReloadModel(modelpath, _models, _definitions) {
  let name = path.basename(modelpath, '.js')
  hotSwapping.cleanRequireCache(modelpath)
  if (fs.existsSync(modelpath)) {
    let factory = require(modelpath)
    let model = factory(_definitions)
    _models[name] = model
  } else {
    _models[name] = null
  }
}

function AddHotSwappingForModels(dir, _models, _definitions) {
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
module.exports = async function (Config) {
  let DBConfig = Config.database
  if (models !== undefined)
    return models;
  if (Config.dev.showDBLog === true)
    Logger = (e) => console.log(e)
  sequelize = ConnectDB(DBConfig)
  definitions = await LoadDefinition(path.resolve(__dirname, 'Model', 'Definition'), sequelize)
  models = await LoadModel(path.resolve(__dirname, 'Model'), definitions)
  if (Config.dev.hotSwap === true)
    AddHotSwappingForModels(path.resolve(__dirname, 'Model'), models, definitions)
  return {sequelize, definitions, models};
}