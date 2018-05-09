const express = require('express')
module.exports = ({Model, Config}) => {
  const router = express.Router()
  router.get('/date', (req, res) =>{
    res.send((new Date()).toGMTString())
  })
  return router
}