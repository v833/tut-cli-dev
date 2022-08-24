// 'use strict'
const semver = require('semver')
const colors = require('colors')

const log = require('@tut-cli-dev/log')
// const { isObject } = require('@tut-cli-dev/utils')

const LOWEST_NODE_VERSION = '12.0.0'

class Command {
  constructor(argv) {
    if (!argv) {
      throw new Error('new Command参数不能为空!')
    }
    if (!Array.isArray(argv)) {
      throw new Error('new Command参数必须为数组!')
    }
    if (argv.length < 1) {
      throw new Error('new Command参数不能为空!')
    }
    this._argv = argv
    let runner = new Promise((resolve, reject) => {
      let chain = Promise.resolve()
      chain = chain.then(() => this.checkNodeVersion())
      chain = chain.then(() => this.initArgs())
      chain = chain.then(() => {
        this.init()
      })
      chain = chain.then(() => {
        this.exec()
      })

      chain.catch((err) => {
        log.error(err)
      })
    })
  }

  // 下沉到子类中定义
  init() {
    throw new Error('init 必须实现')
  }
  exec() {
    throw new Error('exec 必须实现')
  }
  initArgs() {
    this._argv.splice(-1)
    this._cmd = this._argv.at(-1)
  }
  checkNodeVersion() {
    const currentVersion = process.version
    if (!semver.gte(currentVersion, LOWEST_NODE_VERSION)) {
      throw new Error(
        colors.red(`tut-cli 需要安装 v${LOWEST_NODE_VERSION} 以上的node版本`)
      )
    }
  }
}

module.exports = Command
