const example = watchRequire('~/Module/example');
module.exports = (router, {Model, Config}) => {
  router.get('/', (req, res) => {
    res.send(example.say)
  })
  router.get('/vistors', async (req, res) => {
    let result = await Model.example.getVistors()
    res.send(JSON.stringify(result, null, 2))
  })
}