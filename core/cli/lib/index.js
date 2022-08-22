'use strict'

module.exports = core

// require 支持加载的类型 .js .json .node(C++)
// any => 通过.js进行解析
const commander = require('commander')
const semver = require('semver')
const colors = require('colors/safe')
const userHome = require('user-home')
const pathExists = require('path-exists').sync

const pkg = require('../package.json')
const log = require('@tut-cli-dev/log')
const init = require('@tut-cli-dev/init')
const exec = require('@tut-cli-dev/exec')
const { getNpmSemverVersion } = require('@tut-cli-dev/get-npm-info')
const path = require('path')
const { LOWEST_NODE_VERSION, DEFAULT_CLI_HOME } = require('./const')

const program = new commander.Command()

async function core() {
  try {
    await prepare()
    registerCommand()
  } catch (e) {
    // NOTICE
    log.error(e.message)
    if (process.env.LOG_LEVEL === 'verbose') {
      console.log(e)
    }
  }
}

function registerCommand() {
  program
    .name(Object.keys(pkg.bin)[0])
    .usage('<command> [options]')
    .version(pkg.version)
    .option('-d, --debug', '是否开启调试模式', false)
    .option('-tp, --targetPath <targetPath>', '是否指定本地调试文件', '')

  program
    .command('init [projectNmae]')
    .option('-f, --force', '是否强制初始化项目')
    .action(exec) // 动态init

  // 开启debug模式
  // program.on 会在执行业务逻辑之前执行
  program.on('option:debug', function () {
    if (program.opts().debug) {
      process.env.LOG_LEVEL = 'verbose'
    } else {
      process.env.LOG_LEVEL = 'info'
    }
    log.level = process.env.LOG_LEVEL
    log.verbose('verbose_test')
  })

  // 指定全局targetPath
  program.on('option:targetPath', function (targetPath) {
    process.env.CLI_TARGET_PATH = targetPath
  })

  // 监听未知命令
  program.on('command:*', function (unknowCmdList) {
    console.log(colors.red(`未知的命令: ${unknowCmdList.join('、')}`))
    const availableCommands = program.commands.map((cmd) => cmd.name())
    console.log(colors.green(`可用的命令: ${availableCommands.join('、')}`))
  })

  program.parse(process.argv)

  // process.argv.length < 3
  // 通过program.parse(arguments)方法处理参数，没有被使用的选项(command, options, params)会存放在program.args数组中
  if (program.args && program.args.length < 1) {
    program.outputHelp()
    console.log()
  }
}

async function prepare() {
  checkPackageVersion()
  checkNodeVersion()
  checkRoot()
  checkUserHome()
  // checkInputArgs()
  checkEnv()
  await checkGlobalUpdate()
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
  // core: invode process.setuid()
  rootCheck()
  // 管理员为0 使用rootCheck => 管理员不为0
  // console.log(process.getuid())
}
function checkUserHome() {
  if (!userHome || !pathExists(userHome)) {
    throw new Error(colors.red('用户主目录不存在!'))
  }
}
// function checkInputArgs(argvs = process.argv.slice(2) ) {
//   const minimist = require('minimist')
//   args = minimist(argvs)
//   checkArgs()
//   // console.log('args: ', args) // args:  { _: [ 'init', 'u' ], g: true }
// }
// function checkArgs() {
//   if (args.debug) {
//     process.env.LOG_LEVEL = 'verbose'
//   } else {
//     process.env.LOG_LEVEL = 'info'
//   }
//   // NOTICE
//   log.level = process.env.LOG_LEVEL
// }
function checkEnv() {
  // process.cwd() 返回 Node.js 进程当前工作的目录
  const dotenv = require('dotenv')
  const dotenvPath = path.resolve(userHome, '.env')
  if (pathExists(dotenvPath)) {
    dotenv.config({ path: dotenvPath })
  }
  createDefaultConfig()
}
function createDefaultConfig() {
  const cliConfig = { home: userHome }
  if (process.env.CLI_HOME) {
    cliConfig.cliHome = path.join(userHome, process.env.CLI_HOME)
  } else {
    cliConfig.cliHome = path.join(userHome, DEFAULT_CLI_HOME)
  }
  // BETTER 对环境变量的值处理后生成新的环境变量
  process.env.CLI_HOME_PATH = cliConfig.cliHome
}
async function checkGlobalUpdate() {
  // 1. 获取当前版本号和模块名
  // 2. 调用npmApi, 获取所有版本号 https://registry.npmjs.org/@tut-cli-dev/core
  // 3. 提取所有版本号, 比对当前版本号, 如果当前版本号小于最新版本号, 提示更新
  // 4. 提示用户更新到最新版本
  const currentVersion = pkg.version
  const npmName = pkg.name
  const lastVersion = await getNpmSemverVersion(currentVersion, npmName)
  if (lastVersion && semver.gt(lastVersion, currentVersion)) {
    log.warn(
      colors.yellow(
        `当前版本号${currentVersion}不是最新版本号${lastVersion}, 请更新到最新版本
         更新命令: npm install -g ${npmName}@${lastVersion}`
      )
    )
  }
}
