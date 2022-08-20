'use strict'

module.exports = core

// require 支持加载的类型 .js .json .node(C++)
// any => 通过.js进行解析
const semver = require('semver')
const colors = require('colors/safe')

const pkg = require('../package.json')
const log = require('@tut-cli-dev/log')
const { LOWEST_NODE_VERSION } = require('./const')

function core(args) {
  try {
    checkPackageVersion()
    checkNodeVersion()
    checkRoot()
  } catch (e) {
    // NOTICE
    log.error(e.message)
  }
}
function checkPackageVersion() {
  log.notice('cli', pkg.version)
}
function checkNodeVersion() {
  const currentVersion = process.version
  if (!semver.gte(currentVersion, LOWEST_NODE_VERSION)) {
    throw new Error(
      colors.red(`tut-cli 需要安装${LOWEST_NODE_VERSION}以上的node版本`)
    )
  }
}

function checkRoot() {
  const rootCheck = require('root-check')
  rootCheck()
  // 管理员为0 使用rootCheck => 管理员不为0
  console.log(process.getuid())
}
