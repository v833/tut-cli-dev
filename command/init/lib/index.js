// 'use strict'

const Command = require('@tut-cli-dev/command')
const log = require('@tut-cli-dev/log')

class InitCommand extends Command {
  init() {
    this.projectName = this._argv[0] || ''
    this.force = !!this._cmd.force
    log.verbose('projectName', this.projectName)
    log.verbose('force', this.force)
  }
  exec() {
    console.log('init的业务逻辑')
  }
}

function init(argv) {
  return new InitCommand(argv)
}

module.exports = init
module.exports.InitCommand = InitCommand

// function init(projectName, command) {
//   // 不使用箭头函数, 可以使用this代替command
//   // command 当前command
//   // 拿到最外层command 可以通过环境变量获取 <= this.parent.opts().targetPath
//   // console.log('init', projectName, command)
// }
