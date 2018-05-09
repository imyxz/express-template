const Sequelize = require('sequelize')
const fs = require('fs-extra')
const path = require('path');
const chokidar = require('chokidar');
const hotSwapping = require('./hotSwapping')
let sequelize;
let definations;
let models;

function ConnectDB({
  db_name,
  username,
  password,
  host
}) {
  return new Sequelize(db_name, username, password, {
    host: host,
    dialect: 'mysql'
  })
}
async function LoadDefination(dir, _sequelize) {
  let ret = {}
  let list = await fs.readdir(dir)
  let promises = list.filter(e => {
    return path.extname(e) === '.js'
  }).map(e => {
    let name = path.basename(e, '.js')
    ret[name] = _sequelize.import(path.resolve(dir, e))
    return ret[name].sync().then(xxx => {
      console.info(`Load defination ${name} done.`)
    })
  })
  await Promise.all(promises)
  return ret;
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
    depth: 1
  })
  watcher.on('all', (event, filepath) => {
    if (path.extname(filepath) === '.js')
    {
      console.info(`Updating Model ${filepath}...`)
      try{
        dynamicReloadModel(filepath, _models, _definations)
        
      }catch(e){
        console.error(`Error while updating ${filepath}`)
        console.error(e)
      }
    }
  })
}
let exp = async function (DBConfig) {
  if (models !== undefined)
    return models;
  sequelize = ConnectDB(DBConfig)
  definations = await LoadDefination(path.resolve(__dirname, 'Model', 'Defination'), sequelize)
  models = await LoadModel(path.resolve(__dirname, 'Model'), definations)
  if(contest.Config.dev.hotSwapping === true)
    AddHotSwappingForModels(path.resolve(__dirname, 'Model'), models, definations)
  return models;
}
module.exports = exp