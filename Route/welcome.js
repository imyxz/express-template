const express = require('express')
module.exports = ({
  Model,
  Config
}) => {
  const router = express.Router()
  router.get('/', (req, res) => {
    res.send("Hello World!")
  })
  router.get('/vistors', async (req, res) => {
    let result = await Model.example.getVistors()
    res.send(JSON.stringify(result, null, 2))
  })
  return router
}