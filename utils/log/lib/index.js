'use strict'

const log = require('npmlog')

log.leval = process.env.LOG_LEVEL || 'info'
log.heading = 'tut'
log.headingStyle = { fg: 'magenta' }

log.addLevel('success', 2000, { fg: 'green', bold: true })

module.exports = log
