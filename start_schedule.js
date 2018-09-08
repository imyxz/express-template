const server = require('./server')
const Config = require('./configLoader')()
const fs = require('fs-extra')
const path = require('path')
const schedule = require('./schedule');
(async () => {
  const { app,
    context } = await server(false)
  await schedule(context)
})()
