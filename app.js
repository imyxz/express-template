const Database = require('./database');
const Config = require('./config');
const Router = require('./router')
const express = require('express');
const fs = require('fs-extra');
const path = require('path');
(async function (){
  const RouterBaseDir = path.resolve(__dirname, 'Route')
  console.info("Loading Models....")
  const Model = await Database(Config.database);
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
    console.info(`Server started at port ${Config.server.port}`)
  })
})()
