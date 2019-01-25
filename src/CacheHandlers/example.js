module.exports = function ({ Definition }) {
  return {
    keyGenerator: ['id'],
    async failover (keys) {

    },
    async beforeStore (keys, data) {

    },
    async beforeRestore (keys, data) {

    },
    async afterDelete (keys) {

    },
    expire: 60
  }
}
