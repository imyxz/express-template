const _redis = require('redis')
class Redis {
  constructor ({ host, port, db }) {
    this.config = {
      host, port, db
    }
  }
  async connect () {
    return new Promise((resolve, reject) => {
      this.redis = _redis.createClient({
        host: this.config.host,
        port: this.config.port,
        db: this.config.db,
        enable_offline_queue: false
      })
      this.redis.on('connect', _ => resolve())
      this.redis.on('error', _ => reject(_))
    })
  }
  // async hset (key, field, value) {
  //   return new Promise((resolve, reject) => {
  //     this.redis.hset(key, field, value, (err, data) => {
  //       if (err) {
  //         reject(err)
  //         return
  //       }
  //       resolve(data)
  //     })
  //   })
  // }
  // async hget (key, field) {
  //   return new Promise((resolve, reject) => {
  //     this.redis.hget(key, field, (err, data) => {
  //       if (err) {
  //         reject(err)
  //         return
  //       }
  //       resolve(data)
  //     })
  //   })
  // }
  // async hmset (key, object) {
  //   return new Promise((resolve, reject) => {
  //     this.redis.hmset(key, object, (err, data) => {
  //       if (err) {
  //         reject(err)
  //         return
  //       }
  //       resolve(data)
  //     })
  //   })
  // }
  // async hmget (key) {
  //   return new Promise((resolve, reject) => {
  //     this.redis.hmget(key, (err, data) => {
  //       if (err) {
  //         reject(err)
  //         return
  //       }
  //       resolve(data)
  //     })
  //   })
  // }
  async set (key, value, expire) {
    return new Promise((resolve, reject) => {
      const cb = (err, data) => {
        if (err) {
          reject(err)
          return
        }
        resolve(data)
      }
      if (expire) {
        this.redis.set(key, value, 'EX', expire, cb)
      } else {
        this.redis.set(key, value, cb)
      }
    })
  }
  async get (key) {
    return new Promise((resolve, reject) => {
      const cb = (err, data) => {
        if (err) {
          reject(err)
          return
        }
        resolve(data)
      }
      this.redis.get(key, cb)
    })
  }
  async del (key) {
    return new Promise((resolve, reject) => {
      const cb = (err, data) => {
        if (err) {
          reject(err)
          return
        }
        resolve(data)
      }
      this.redis.del(key, cb)
    })
  }
}
module.exports = Redis
