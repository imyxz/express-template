const express = require('express');
const fs = require('fs-extra');
const path = require('path');
const chokidar = require('chokidar');
const hotSwapping = require('./hotSwapping');
let EnableHotSwapping
let routeTree
async function readdirFiles(Path) {
  let files = await fs.readdir(Path)
  let ret = []
  let promises = files.map(e => {
    return fs.stat(path.resolve(Path, e)).then(stat => {
      if (stat.isFile() === true) {
        ret.push(e)
      }
    })
  })
  await Promise.all(promises)
  return ret
}
async function readdirDirs(Path) {
  let files = await fs.readdir(Path)
  let ret = []
  let promises = files.map(e => {
    return fs.stat(path.resolve(Path, e)).then(stat => {
      if (stat.isDirectory() === true) {
        ret.push(e)
      }
    })
  })
  await Promise.all(promises)
  return ret
}

async function dynamicReloadRoute(baseDir, filepath, event, context, _routeTree) {
  let actualPath = path.relative(baseDir, filepath)
  let route2file = actualPath.split(path.sep)
  let tree = _routeTree
  let curPath = baseDir
  for (let i = 0; i < route2file.length - 1; i++) {
    let childName = route2file[i]
    curPath = path.resolve(curPath, childName)
    if (tree.childs[childName] === undefined) //Add event, just use LoadRouter to load it
    {
      let [subRouter, subTree] = await LoadRouter(curPath, context)
      tree.childs[childName] = subTree;
      ((childName) => {
        tree.root.use(`/${childName}/`, (req, res, next) => {
          return tree.childs[childName].root(req, res, next) //subRouter = subTree.root
        })
      })(childName)
      return
    }
    tree = tree.childs[childName]
  }
  let fileName = route2file[route2file.length - 1]
  hotSwapping.cleanRequireCache(filepath)
  let subRouter
  if (!fs.existsSync(filepath)) //route file is deleted
  {
    subRouter = express.Router()
  } else {
    subRouter = require(filepath)(context)
  }
  if (fileName === 'index.js') { //need to reload depth 1 childs
    tree.root = subRouter
    for (let name in tree.processor) {
      ((name) => {
        tree.root.use('/', (req, res, next) => {
          return tree.processor[name](req, res, next)
        })
      })(name)

    }
    for (let name in tree.childs) {
      ((name) => {
        tree.root.use(`/${name}/`, (req, res, next) => {
          return tree.childs[name].root(req, res, next)
        })
      })(name)

    }
  } else {
    if (tree.processor[fileName] === undefined) { //newfile, need to call router.use
      tree.processor[fileName] = subRouter
      tree.root.use('/', (req, res, next) => {
        return tree.processor[fileName](req, res, next)
      })
    } else {
      tree.processor[fileName] = subRouter //no need to call router.use as we use closure
    }
  }
}
async function AddHotSwappingForRoutes(dir, context, _routeTree) {
  let watcher = chokidar.watch(dir, {
    persistent: true,
    ignoreInitial: true
  })
  watcher.on('all', (event, filepath) => {
    if (path.extname(filepath) === '.js') {
      console.info(`Updating route ${filepath}`)
      dynamicReloadRoute(dir, filepath, event, context, _routeTree).then(e => {
        console.info('Done!')
      }).catch(e => {
        console.error(`Error while updating ${filepath}`)
        console.error(e)
      })
    }

  })
}
async function LoadRouter(BasePath, context) {
  let files = await readdirFiles(BasePath)
  let dirs = await readdirDirs(BasePath)
  let tree = {
    root: {},
    processor: {},
    childs: {}
  }
  let baseRouter
  if (files.find((e) => e === 'index.js') !== undefined) {
    baseRouter = require(path.resolve(BasePath, 'index.js'))(context)
  } else {
    baseRouter = express.Router()
  }
  tree.root = baseRouter
  files.filter(e => path.extname(e) === '.js' && e !== 'index.js').forEach(e => {
    let subRouter = require(path.resolve(BasePath, e))(context)
    tree.processor[e] = subRouter
    if (EnableHotSwapping) {
      baseRouter.use('/', (req, res, next) => {
        return tree.processor[e](req, res, next)
      })
    } else {
      baseRouter.use('/', tree.processor[e])
    }


  })
  let promises = dirs.map(e => {
    return LoadRouter(path.resolve(BasePath, e), context).then(subRet => {
      let [subRouter, subTree] = subRet
      tree.childs[e] = subTree
      if (EnableHotSwapping) {
        baseRouter.use(`/${e}/`, (req, res, next) => {
          return tree.childs[e].root(req, res, next) //subRouter = subTree.root
        })
      } else {
        baseRouter.use(`/${e}/`, tree.childs[e].root)
      }
    })
  })
  await Promise.all(promises)
  return [baseRouter, tree]
}
module.exports = async function (baseDir, context) {
  EnableHotSwapping = context.Config.dev.hotSwap
  let routes = await LoadRouter(baseDir, context) //[router, tree]
  routeTree = routes[1]
  if (EnableHotSwapping === true)
    await AddHotSwappingForRoutes(baseDir, context, routeTree)
  let retRouter = express.Router() //Add a router at root to enable /index.js hot swapping
  retRouter.use('/', (req, res, next) => {
    return routeTree.root(req, res, next)
  })
  return [retRouter, routeTree]
}