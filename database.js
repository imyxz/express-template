const Sequelize = require('sequelize')
const fs = require('fs-extra')
const path = require('path');
const chokidar = require('chokidar');
const hotSwapping = require('./hotSwapping')
let sequelize;
let definations;
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

async function LoadAssociation(dir, _definations) {
  let ret = {}
  let list = await fs.readdir(dir)
  list.filter(e => {
    return path.extname(e) === '.js'
  }).forEach(e => {
    let func = require(path.resolve(dir, e));
    func(_definations)
    console.info(`Load association in ${path.basename(e)} done.`)
  })
}
async function LoadDefination(dir, _sequelize) {
  let _definations = {}
  let list = await fs.readdir(dir)
  list.filter(e => {
    return path.extname(e) === '.js'
  }).forEach(e => {
    let name = path.basename(e, '.js')
    console.info(`Loading defination ${name}...`)
    _definations[name] = _sequelize.import(path.resolve(dir, e))
  })
  await LoadAssociation(path.resolve(dir, 'Association'), _definations)
  let promises = Object.values(_definations).map(e => {
    return e.sync()
  })
  await Promise.all(promises).then(xxx => {
    console.info(`Load definations done.`)
  })
  return _definations;
}
async function LoadModel(dir, _definations) {
  let ret = {}
  let list = await fs.readdir(dir)
  list.filter(e => {
    return path.extname(e) === '.js'
  }).forEach(e => {
    let name = path.basename(e, '.js')
    let factory = require(path.resolve(dir, e))
    ret[name] = factory(_definations)

    console.info(`Load model ${name} done.`)
  })
  return ret;
}

function dynamicReloadModel(modelpath, _models, _definations) {
  let name = path.basename(modelpath, '.js')
  hotSwapping.cleanRequireCache(modelpath)
  if (fs.existsSync(modelpath)) {
    let factory = require(modelpath)
    let model = factory(_definations)
    _models[name] = model
  } else {
    _models[name] = null
  }
}

function AddHotSwappingForModels(dir, _models, _definations) {
  let watcher = chokidar.watch(dir, {
    persistent: true,
    ignoreInitial: true,
    depth: 0
  })
  watcher.on('all', (event, filepath) => {
    if (path.extname(filepath) === '.js') {
      console.info(`Updating Model ${filepath}...`)
      try {
        dynamicReloadModel(filepath, _models, _definations)
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
  definations = await LoadDefination(path.resolve(__dirname, 'Model', 'Defination'), sequelize)
  models = await LoadModel(path.resolve(__dirname, 'Model'), definations)
  if (Config.dev.hotSwap === true)
    AddHotSwappingForModels(path.resolve(__dirname, 'Model'), models, definations)
  return models;
}