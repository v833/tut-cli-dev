#!/usr/bin/env node

const utils = require('@tut-cli-dev/utils')
// 全局安装的包如果本地有安装,优先用本地的
const importLocal = require('import-local')
const colors = require('colors')
const commander = require('commander')
const pkg = require('../package.json')

// 获取commanderd单例
// const { program } = commander
// 手动实例化一个commander
const program = new commander.Command()
program
  .name(Object.keys(pkg.bin)[0])
  .usage('<command> [options]')
  .version(pkg.version)
  .option('-d, --debug', '是否启动调试模式', false)
  .option('-e, --env <envName>', '获取环境变量名称')
// commmand api注册命令
// []: 可填项 <>必填项
const clone = program.command('clone <source> [destination]')
// 这里不能连写 初始化clone(program.command)会返回一个新的command对象
clone
  .description('clone a repository')
  .option('-f, --force', '是否强制克隆')
  .action((source, destination, cmdObj) => {
    // cmdObj 当前command
  })

// addCommnad 注册子命令
const service = new commander.Command('service')
service.description('some server options')

service
  .command('start [port]')
  .description('start service at some port')
  .action((port) => {
    console.log(port)
  })

service
  .command('stop')
  .description('stop service')
  .action(() => {
    console.log('stop service')
  })

program.addCommand(service)

// 高级定制 实现debug 模式
program.on('option:debug', function () {
  if (this.opts().debug) {
    process.env.LOG_LEVEL = 'verbose'
  }
})

// 高级定制 对未知命令监听
program.on('command:*', function (unknowCmdList) {
  console.log(colors.red(`未知的命令: ${unknowCmdList.join('、')}`))
  const availableCommands = program.commands.map((cmd) => cmd.name())
  console.log(colors.green(`可用的命令: ${availableCommands.join('、')}`))
})

// 监听所有的命令输入, 处理未定义的命令
// program
//   .arguments('[command] [options]')
//   .description('test command', {
//     command: 'command to run',
//     options: 'options for command'
//   })
//   .action((cmd, env) => {
//     // console.log(cmd, env)
//   })

// 通过独立的的可执行文件实现命令 (注意这里指令描述是作为`.command`的第二个参数)
// 多脚手架串用 tut install init => tut-i init
program
  .command('install [name]', 'install package', {
    executableFile: 'tut-i', // 修改可执行文件名称
    isDefault: false,
    hidden: true
  })
  .alias('i') // tut-install

// 高级定制: 自定义help内容
// program.helpInformation = function () {
//   return 'info'
// }
// program.on('--help', function () {
//   console.log('info')
// })

program.parse(process.argv)
// program.outputHelp()
// console.log(program.opts())
// __filenam 获取当前目录
// __dirname 获取当前目录的父目录

// if (importLocal(__filename)) {
// } else {
//   // 去除node路径和bin路径
//   require('../lib/index.js')(process.argv.slice(2))
// }
