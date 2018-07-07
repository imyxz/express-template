module.exports = function(fn){
  return function(req, res, next){
    fn(req,res,next).catch(e=>{
      //process the error here
      console.log(e)
      res.status(500).send('Internal error')
      next(e)
    })
  }
}