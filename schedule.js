const Sequelize = require('sequelize')
const fs = require('fs-extra')
const path = require('path')
const chokidar = require('chokidar')
const hotSwapping = require('./hotSwapping')
const moment = require('moment')
let sequelize
let definitions
let models
async function LoadSchedule (dir, context) {
  let ret = []
  let list = await fs.readdir(dir)
  list.filter(e => {
    return path.extname(e) === '.js'
  }).forEach(e => {
    let name = path.basename(e, '.js')
    let func = require(path.resolve(dir, e))
    let { interval, runner, name: subname } = func(context)
    ret.push({
      interval,
      runner,
      name: subname
    })
    console.info(`Load schedule ${name} done.`)
  })
  return ret
}
async function asyncTimeout (time) {
  return new Promise((resolve, reject) => {
    setTimeout(() => resolve(), time)
  })
}
async function scheduler (schedules) {
  let jobs = []
  jobs = schedules.map(e => {
    return {
      nextRunTime: moment(),
      lastRunTime: moment(),
      running: false,
      interval: e.interval,
      runner: e.runner,
      name: e.name
    }
  })
  let cnt = 60
  while (true) {
    await asyncTimeout(1000)
    cnt ++
    if (cnt >= 60) {
      cnt = 0
      printStatus(jobs)
    }
    for (let schedule of jobs) {
      if (schedule.running === false && moment().isSameOrAfter(schedule.nextRunTime) === true) {
        schedule.running = true
        runner(schedule)
      }
    }
  }
}
function printStatus (schedules) {
  console.log(moment().toISOString())
  console.log('name\tlastRunTime\tnextRunTime\trunning')
  schedules.forEach(e => {
    let { name, lastRunTime, nextRunTime, interval, running } = e
    console.log(`${name}\t${lastRunTime}\t${nextRunTime}\t${running}`)
  })
}
async function runner (schedule) {
  await schedule.runner().catch(e => {
    console.error(schedule.name + 'faild')
    console.error(e)
  })
  schedule.lastRunTime = moment()
  schedule.nextRunTime = moment().add(schedule.interval, 'second')
  schedule.running = false
}
module.exports = async function (context) {
  let schedules = await LoadSchedule(path.resolve(__dirname, 'Schedule'), context)
  console.log('Scheduler started!')
  await scheduler(schedules)
}
