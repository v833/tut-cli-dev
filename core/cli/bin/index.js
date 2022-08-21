#!/usr/bin/env node

const importLocal = require('import-local')
// __filenam 获取当前目录
// __dirname 获取当前目录的父目录

if (importLocal(__filename)) {
} else {
  // 去除node路径和bin路径
  require('../lib/index.js')()
}
