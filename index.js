'use strict'

const path = require('path')

module.exports = (robot, scripts) => {
  const scriptsPath = path.resolve(__dirname, 'src')
  robot.loadFile(scriptsPath, 'help.js')
}
