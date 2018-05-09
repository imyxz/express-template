//DOC: http://docs.sequelizejs.com/manual/tutorial/models-usage.html
module.exports = ({example}) => {
  return {
    async addVistor(ip, date) {
      let ret = await example.create({
        ip: ip,
        date: date
      })
      return ret.dataValues.id
    },
    async getVistors() {
      return await example.findAll({limit: 10, order: [['id', 'desc']]})
    }
  }
}