const Redis = require('./redis')
const fs = require('fs-extra')
const path = require('path')
const assert = require('assert')
function tryParse (json) {
  let result = null
  try {
    result = JSON.parse(json)
  } catch (e) {

  }
  return result
}
function defaultKeyGenerator (data, expectedKeys) {
  return expectedKeys.map(e => {
    if (data[e] === undefined || data[e] === null) {
      return ''
    } else {
      return String(data[e])
    }
  }).join('_')
}
class CacheHandler {
  constructor (redis) {
    this.redis = redis
    this.handlers = new Map()
    this.redisOk = true
  }
  setRedisStatus (status) {
    this.redisOk = status
  }
  register (field, handler) {
    handler = this.checkHandler(handler)
    this.handlers.set(field, handler)
  }
  checkHandler ({ keyGenerator,
    failover,
    beforeStore,
    beforeRestore, // 接收到的并未经过beforeRestore数据
    afterDelete,
    expire }) {
    assert.strictEqual(typeof failover, 'function')
    if (keyGenerator instanceof Array) {
      const expectedKeys = keyGenerator
      keyGenerator = function (keys) {
        return defaultKeyGenerator(keys, expectedKeys)
      }
    } else {
      assert.strictEqual(typeof keyGenerator, 'function')
    }
    if (beforeStore) {
      assert.strictEqual(typeof beforeStore, 'function')
    }
    if (beforeRestore) {
      assert.strictEqual(typeof beforeRestore, 'function')
    }
    if (afterDelete) {
      assert.strictEqual(typeof afterDelete, 'function')
    }
    if (expire) {
      assert.strictEqual(typeof expire, 'number')
    }
    return {
      keyGenerator,
      failover,
      beforeStore,
      beforeRestore, // 接收到的并未经过beforeRestore数据
      afterDelete,
      expire
    }
  }
  getHandlerByField (field) {
    if ((typeof field) === 'string') {
      assert.strictEqual(this.handlers.has(field), true)
      return {
        field_name: field,
        handler: this.handlers.get(field)
      }
    } else if ((typeof field) === 'object') {
      assert.strictEqual(typeof field.field, 'string')
      const field_name = field.field
      field = this.checkHandler(field)
      return {
        field_name,
        handler: field
      }
    } else {
      throw new Error('field type error')
    }
  }
  // 如果field是string，则读取Cache目录下的handler。如果是Object,则读取其中的配置
  async fetch (field, keys) {
    const { field_name, handler } = this.getHandlerByField(field)
    const { keyGenerator, failover, beforeStore, beforeRestore, expire } = handler
    const trueKey = field_name + ':' + await keyGenerator(keys)
    let isRedisFail = false
    let result = null
    if (this.redisOk === true) {
      result = await this.redis.get(trueKey).catch(e => {
        console.error(e)
        isRedisFail = true
        this.setRedisStatus(false)
        return null
      })
    }
    if (result === null) {
      // console.log(`Miss cache ${trueKey}`)
      result = await failover(keys)
      if (isRedisFail === false && this.redisOk === true) {
        let toSet = ''
        if (beforeStore) {
          toSet = await beforeStore(keys, result)
        }
        toSet = JSON.stringify(result)
        await this.redis.set(trueKey, toSet, expire)
      }
    } else {
      // console.log(`Hit cache ${trueKey}`)
      result = tryParse(result)
      if (beforeRestore) {
        result = await beforeRestore(keys, result)
      }
    }
    return result
  }
  async delete (field, keys) {
    const { field_name, handler } = this.getHandlerByField(field)
    const { keyGenerator, afterDelete } = handler
    if (this.redisOk === true) {
      const trueKey = field_name + ':' + await keyGenerator(keys)
      await this.redis.del(trueKey)
    }
    if (afterDelete) {
      await afterDelete(keys)
    }
  }
}
async function readdirFiles (Path) {
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
async function LoadHandlers (cacheHandler, BasePath, context) {
  let files = await readdirFiles(BasePath)
  files.filter(e => path.extname(e) === '.js').forEach(e => {
    const handler = require(path.resolve(BasePath, e))(context)
    cacheHandler.register(path.basename(e, '.js'), handler)
  })
  return cacheHandler
}
module.exports = async function (baseDir, context) {
  const Config = context.Config
  let redis = new Redis(Config.redis)
  const cacheHandler = new CacheHandler(redis)
  if (Config.redis.enable === true) {
    await redis.connect().catch(e => {
      console.error('redis faild')
      console.error(e)
      cacheHandler.setRedisStatus(false)
    })
  } else {
    cacheHandler.setRedisStatus(false)
  }
  await LoadHandlers(cacheHandler, baseDir, context)
  async function checkStatus () {
    if (cacheHandler.redisOk === false) {
      await redis.connect().then(e => {
        console.info('redis reconnected')
        cacheHandler.setRedisStatus(true)
      }).catch(e => {
        console.error('redis faild')
        console.error(e)
        cacheHandler.setRedisStatus(false)
      })
    }
    setTimeout(checkStatus, 30 * 1000)
  }
  if (Config.redis.enable === true) {
    setTimeout(checkStatus, 30 * 1000)
  }
  return cacheHandler
}
