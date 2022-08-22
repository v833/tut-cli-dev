'use strict'

const path = require('path')

function formatPath(p) {
  if (!p) return p
  // macOC '/'  windows '\'
  const sep = path.sep
  if (sep === '/') return p
  return p.replace('/\\/g', '/')
}

module.exports = formatPath
