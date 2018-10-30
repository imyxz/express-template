const server = require('./server')
const schedule = require('./schedule');
(async () => {
  const { app,
    context } = await server(false)
  await schedule(context)
})()
