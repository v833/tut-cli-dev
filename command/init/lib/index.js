'use strict'

function init(projectName, command) {
  // 不使用箭头函数, 可以使用this代替command
  // command 当前command
  console.log('projectName: ', projectName)
  console.log(this.opts().force)
}

module.exports = init
