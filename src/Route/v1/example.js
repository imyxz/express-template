module.exports = (router, { Model, Config }) => {
  router.get('/date', (req, res) => {
    res.send((new Date()).toGMTString())
  })
}
