module.exports = (router, {Model, Config}) => {
  router.get('/space', (req, res) =>{
    res.json(req.params)
  })
}