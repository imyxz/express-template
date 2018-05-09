const express = require('express');
const fs = require('fs-extra');
const path = require('path');

async function readdirFiles(Path){
  let files = await fs.readdir(Path)
  let ret = []
  let promises = files.map(e => {
    return fs.stat(path.resolve(Path, e)).then(stat => {
      if(stat.isFile() === true){
        ret.push(e)
      }
    })
  })
  await Promise.all(promises)
  return ret
}
async function readdirDirs(Path){
  let files = await fs.readdir(Path)
  let ret = []
  let promises = files.map(e => {
    return fs.stat(path.resolve(Path, e)).then(stat => {
      if(stat.isDirectory() === true){
        ret.push(e)
      }
    })
  })
  await Promise.all(promises)
  return ret
}
async function LoadRouter(BasePath, context){
  let files = await readdirFiles(BasePath)
  let dirs = await readdirDirs(BasePath)
  let tree = {
    root: '',
    processor: [],
    childs: {}
  }
  let baseRouter
  if(files.find((e) => e === 'index.js') !== undefined) {
    baseRouter = require(path.resolve(BasePath, 'index.js'))(context)
    tree.root = 'index.js'
  } else {
    baseRouter = express.Router()
  }
  files.filter(e=>path.extname(e) === '.js' && e !== 'index.js').forEach(e => {
    baseRouter.use('/', require(path.resolve(BasePath, e))(context))
    tree.processor.push(e)
  })
  let promises = dirs.map(e => {
    return LoadRouter(path.resolve(BasePath, e), context).then(subRet => {
      let [subRouter, subTree] = subRet
      baseRouter.use(`/${e}/`,subRouter)
      tree.childs[e] = subTree
    })
  })
  await Promise.all(promises)
  return [baseRouter, tree]
}
module.exports = async function(baseDir, context) {
  return await LoadRouter(baseDir, context)
}