// 'use strict'

const path = require('path')

const Package = require('@tut-cli-dev/package')
const log = require('@tut-cli-dev/log')

const SETTINGS = {
  init: '@tut-cli-dev/init'
}

const CACHE_DIR = 'dependencies'

async function exec() {
  let pkg
  const homePath = process.env.CLI_HOME_PATH
  // 1. targetPath -> modulePath
  // 2. modulePath -> Package(npm模块)
  // 3. Package.getRootFile() 获取入口文件
  // 4. Package.update / Package.install
  let targetPath = process.env.CLI_TARGET_PATH
  let storeDir = ''
  const args = [].slice.call(arguments)
  // 最后一个参数是command
  const cmdObj = args.at(-1)
  const packageName = SETTINGS[cmdObj.name()]
  const packageVersion = 'lastest'

  if (!targetPath) {
    targetPath = path.resolve(homePath, CACHE_DIR)
    storeDir = path.resolve(targetPath, 'node_modules')
    log.verbose('targetPath', targetPath)
    log.verbose('storeDir', storeDir)
    log.verbose('homePath', homePath)

    pkg = new Package({
      targetPath,
      storeDir,
      packageName,
      packageVersion
    })
    if (await pkg.exists()) {
      // 更新package
      await pkg.update()
    } else {
      // 安装package
      await pkg.install()
    }
  } else {
    pkg = new Package({
      targetPath,
      packageName,
      packageVersion
    })
  }

  const rootFile = pkg.getRootFilePath()
  if (rootFile) {
    // BETTER 在当前进程中调用
    require(rootFile).apply(null, arguments)
    // 在node子进程中进行
  }
}

module.exports = exec
