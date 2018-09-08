const server = require('./server')
const Config = require('./configLoader')();
(async () => {
  let {app} = await server()
  app.listen(Config.server.port, () => {
    console.info(`Server started at http://localhost:${Config.server.port}${Config.server.prefix || '/'}`)
  })
})()