const hotSwapping = require('./hotSwapping')
global._require = hotSwapping._require
global.watchRequire = hotSwapping.watchRequire
const Database = require('./database')
let Config
const Router = require('./router')
const express = require('express')
const fs = require('fs-extra')
const path = require('path')
const ConfigLoader = require('./configLoader')
const ExpressAsyncWrapper = require('./ExpressAsyncWrapper')
module.exports = async function (loadroutes = true) {
  Config = ConfigLoader()
  // expose to global to convenient for require module
  const RouterBaseDir = path.resolve(__dirname, Config.server.route_dir)
  console.info('Loading Models....')
  const DB = await Database(Config)
  console.info('Done!\n')
  const context = {
    Model: DB.models,
    Definition: DB.definitions,
    Sequelize: DB.sequelize,
    Config,
    Wrapper: ExpressAsyncWrapper
  }
  let app
  if (loadroutes === true) {
    console.info('Loading Routes....')
    let [router, routerTree] = await Router(RouterBaseDir, context)
    console.info('Done!\n')
    app = express()
    app.use('/', router)
  }
  return { app, context }
}
