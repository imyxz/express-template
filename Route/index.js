const express = require('express')
module.exports = ({Model, Config}) => {
  const router = express.Router()
  router.use((req, res, next) => {
    await Model.example.addVistor(req.ip, (new Date()).toLocaleString())
    console.log('This message is from middleware in /index.js')
    next()
  })
  return router
}