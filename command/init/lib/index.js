'use strict'

function init(projectName, command) {
  // 不使用箭头函数, 可以使用this代替command
  // command 当前command
  // 拿到最外层command 可以通过环境变量获取 <= this.parent.opts().targetPath
  console.log('init', projectName, command)
}

module.exports = init
