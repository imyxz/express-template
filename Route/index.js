module.exports = (router, {Model, Config}) => {
  router.use(async (req, res, next) => {
    await Model.example.addVistor(req.ip, (new Date()).toLocaleString())
    console.log('This message is from middleware in /index.js')
    next()
  })
}