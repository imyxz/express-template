const mockRequire = require('./core/mock-require')
global.watchRequire = mockRequire.watchRequire
const Database = require('./core/database')
let Config
const Router = require('./core/router')
const express = require('express')
const fs = require('fs-extra')
const path = require('path')
const Cache = require('./core/cache-handler-loader')
const ConfigLoader = require('./core/config-loader')
const ExpressAsyncWrapper = require('./core/express-async-wrapper')
module.exports = async function (loadroutes = true) {
  Config = ConfigLoader()
  // expose to global to convenient for require module
  const RouterBaseDir = path.resolve(__dirname, 'src', Config.server.route_dir)
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
  console.info('Loading cache handlers....')
  const cache = await Cache(path.resolve(__dirname, 'src/CacheHandlers'), context)
  console.info('Done!\n')
  context.Cache = cache
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
