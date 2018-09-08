let context
async function runner () {
  console.log(new Date())
}
module.exports = function (_context) {
  context = _context
  return {
    name: 'ticker',
    interval: 1,
    runner
  }
}
