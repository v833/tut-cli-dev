// 'use strict'
const inquirer = require('inquirer')
const semver = require('semver')
const Command = require('@tut-cli-dev/command')
const log = require('@tut-cli-dev/log')
const fs = require('fs')
const fse = require('fs-extra')
const getProjectTemplate = require('./getProjectTemplate')

const TYPE_PROJECT = 'project'
const TYPE_COMPONENT = 'component'

log.level = process.env.LOG_LEVEL

class InitCommand extends Command {
  init() {
    this.projectName = this._argv[0] || ''
    this.force = !!this._cmd.force
    log.verbose('projectName', this.projectName)
    log.verbose('force', this.force)
  }
  async exec() {
    try {
      // init的业务逻辑
      // 1. 准备阶段
      const projectInfo = await this.prepare()
      if (projectInfo) {
        log.verbose('projectInfo', projectInfo)
        this.projectInfo = projectInfo
        // 2. 下载模板
        this.downloadTemplate()
        // 3. 安装模板
      }
    } catch (e) {
      log.error(e.message)
    }
  }
  downloadTemplate() {
    // 1. 通过项目模板API获取项目模板信息
    // 1.1 通过egg.js搭建一套后端系统
    // 1.2 通过npm存储项目模板(vue-cli/vue-element-admin)
    // 1.3 将项目模板信息存储到mongodb数据库中
    // 1.4 通过egg.js获取mongodb中的数据并返回
  }
  async prepare() {
    // 0. 判断项目模板是否存在
    const template = await getProjectTemplate()
    if (!template || template.length === 0) {
      throw new Error('项目模板不存在')
    }
    this.template = template
    const localPath = process.cwd() // path.resolve('.'), 不能使用__dirname

    // 1. 判断当前目录时否为空
    const ret = this.isDirEmpty(localPath)
    // 2. 是否启动强制更新
    let ifContinue = false
    if (!ret) {
      if (!this.force) {
        ifContinue = (
          await inquirer.prompt({
            type: 'confirm',
            name: 'ifContinue',
            default: false,
            message: '当前文件夹不为空, 是否继续创建项目?'
          })
        ).ifContinue
        if (!ifContinue) return
      }
      if (ifContinue || this.force) {
        // 做二次确认
        const { confirmDelete } = await inquirer.prompt({
          type: 'confirm',
          name: 'confirmDelete',
          default: false,
          message: '是否确认清空当前目录下的文件?'
        })
        if (confirmDelete) {
          // 清空当前目录
          fse.emptyDirSync(localPath)
        }
      }
    }
    return await this.getProjectInfo()
  }
  async getProjectInfo() {
    let projectInfo = {}
    // 3. 选择创建项目或组件
    const { type } = await inquirer.prompt({
      type: 'list',
      name: 'type',
      message: '请选择初始化类型',
      default: TYPE_PROJECT,
      choices: [
        { name: '项目', value: TYPE_PROJECT },
        { name: '组件', value: TYPE_COMPONENT }
      ]
    })
    log.verbose('type', type)
    if (type === TYPE_PROJECT) {
      // 4. 获取项目的基本信息
      const project = await inquirer.prompt([
        {
          type: 'input',
          name: 'projectName',
          message: '请输入项目名称',
          validate: function (v) {
            // 1. 输入的首字符必须为英文字符
            // 2. 尾字符必须为英文或数字, 不能为字符
            // 3. 字符仅仅允许'-_'

            // tip
            const done = this.async()

            setTimeout(() => {
              if (
                !/^[a-zA-Z]+(-[a-zA-Z][a-zA-Z0-9]*|_[a-zA-Z][a-zA-Z0-9]*|[a-zA-Z0-9])*$/.test(v)
              ) {
                done('请输入合法的项目名称')
                return
              }
              done(null, true)
            }, 0)
          }
        },
        {
          type: 'input',
          name: 'projectVersion',
          message: '请输入项目版本号',
          validate: function (v) {
            const done = this.async()

            setTimeout(() => {
              if (!semver.valid(v)) {
                done('请输入合法的版本号')
                return
              }
              done(null, true)
            }, 0)
          },
          filter: function (v) {
            if (!!semver.valid(v)) {
              return semver.valid(v)
            } else {
              return v
            }
          }
        },
        {
          type: 'list',
          name: 'projectTemplate',
          message: '请选择项目模板',
          choices: this.createTemplateChoices()
        }
      ])
      projectInfo = {
        type,
        ...project
      }
    } else if (type === TYPE_COMPONENT) {
    }

    return projectInfo
  }
  isDirEmpty(localPath) {
    let fileList = fs.readdirSync(localPath)
    fileList = fileList.filter((file) => {
      return !file.startsWith('.') && !['node_modules'].includes(file)
    })
    return !fileList?.length
  }
  createTemplateChoices() {
    return this.template.map((item) => ({
      name: item.name,
      value: item.npmName
    }))
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
