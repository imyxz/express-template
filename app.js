const Database = require('./database');
let Config
const Router = require('./router')
const express = require('express');
const fs = require('fs-extra');
const path = require('path');
(async function (){
  let mod = process.argv[2]
  if(mod === 'development')
    Config = require('./config.development.js')
  else if(mod === 'production')
    Config = require('./config.production.js')
  const RouterBaseDir = path.resolve(__dirname, 'Route')
  console.info("Loading Models....")
  const Model = await Database(Config);
  console.info("Done!\n")
  const context = {
    Model,
    Config
  }
  console.info("Loading Routes....")
  let [router, routerTree] = await Router(RouterBaseDir, context)
  console.info(routerTree)
  console.info("Done!\n")
  let app = express()
  app.use('/', router)
  app.listen(Config.server.port, () => {
    console.info(`Server started at http://localhost:${Config.server.port}${Config.server.prefix || '/'}`)
  })
})()
