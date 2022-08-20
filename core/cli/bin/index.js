#!/usr/bin/env node

const utils = require('@tut-cli-dev/utils')
// 全局安装的包如果本地有安装,优先用本地的
const importLocal = require('import-local')

// __filenam 获取当前目录
// __dirname 获取当前目录的父目录

if (importLocal(__filename)) {
} else {
  // 去除node路径和bin路径
  require('../lib/index.js')(process.argv.slice(2))
}
