const server = require('./server')
const Config = require('./core/config-loader')()
const fs = require('fs-extra')
const path = require('path')
const schedule = require('./core/schedule');
(async () => {
  const { app,
    context } = await server(false)
  await schedule(context)
})()
