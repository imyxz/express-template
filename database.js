const Sequelize = require('sequelize')
const fs = require('fs-extra')
const path = require('path');
let sequelize;
let definations;
let models;
function ConnectDB({db_name, username, password, host}){
  return new Sequelize(db_name, username, password, {
    host: host,
    dialect: 'mysql'
  })
}
async function LoadDefination(dir, _sequelize){
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
async function LoadModel(dir, _definations){
  let ret = {}
  let list = await fs.readdir(dir)
  list.filter(e => {
    return path.extname(e) === '.js'
  }).forEach(e => {
    let name = path.basename(e, '.js')
    let factory = require(path.resolve(dir,e))
    ret[name] = factory(_definations)
    console.info(`Load model ${name} done.`)
  })
  return ret;
}
let exp = async function (DBConfig) {
  if(models !== undefined)
    return models;
  sequelize = ConnectDB(DBConfig)
  definations = await LoadDefination(path.resolve(__dirname,'Model','Defination'), sequelize)
  models = await LoadModel(path.resolve(__dirname, 'Model'), definations)
  return models;
}
module.exports = exp