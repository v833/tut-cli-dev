// 'use strict'
const inquirer = require('inquirer')
const semver = require('semver')
const userHome = require('user-home')
const ejs = require('ejs')
const glob = require('glob')

const Command = require('@tut-cli-dev/command')
const Package = require('@tut-cli-dev/package')
const log = require('@tut-cli-dev/log')
const { spinnerStart, sleep, execAsync } = require('@tut-cli-dev/utils')

const fs = require('fs')
const fse = require('fs-extra')
const path = require('path')
const getProjectTemplate = require('./getProjectTemplate')

const TYPE_PROJECT = 'project'
const TYPE_COMPONENT = 'component'

const TEMPLATE_TYPE_NORMAL = 'normal'
const TEMPLATE_TYPE_CUSTOM = 'custom'

const WHITE_COMMAND = ['npm', 'cnpm', 'yarn', 'pnpm']
// log.level = process.env.LOG_LEVEL

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
        await this.downloadTemplate()
        // 3. 安装模板
        this.installTemplate()
      }
    } catch (e) {
      log.error(e.message)
      if (process.env.LOG_LEVEL === 'verbose') {
        console.log(e)
      }
    }
  }
  async installTemplate() {
    if (this.templateInfo) {
      if (!this.templateInfo.type) this.templateInfo.type = TEMPLATE_TYPE_NORMAL
      if (this.templateInfo.type === TEMPLATE_TYPE_NORMAL) {
        // 标准安装
        await this.installNormalTemplate()
      } else if (this.templateInfo.type === TEMPLATE_TYPE_CUSTOM) {
        // 自定义安装
        await this.installCustomTemplate()
      } else {
        throw new Error('无法识别项目模版!')
      }
    } else {
      throw new Error('项目模版信息不存在!')
    }
  }
  checkCommand(cmd) {
    if (WHITE_COMMAND.includes(cmd)) {
      return cmd
    } else {
      return null
    }
  }
  async execCommand(command, errMsg) {
    let ret
    const cmdArray = command?.split(' ')
    if (cmdArray && cmdArray.length > 0) {
      const cmd = this.checkCommand(cmdArray[0])
      if (!cmd) {
        throw new Error('命令不存在! 命令: ' + command)
      }
      const args = cmdArray.slice(1)
      ret = await execAsync(cmd, args, {
        stdio: 'inherit',
        cwd: process.cwd()
      })
    }
    if (ret !== 0) {
      throw new Error(errMsg)
    }
  }
  async ejsRender(options) {
    const dir = process.cwd()
    const projectInfo = this.projectInfo
    return new Promise((resolve, reject) => {
      glob(
        '**',
        {
          cwd: dir,
          ignore: options.ignore || '',
          nodir: true
        },
        (err, files) => {
          if (err) {
            reject(err)
          }
          Promise.all(
            files.map((file) => {
              const filePath = path.join(dir, file)
              return new Promise((resolve1, reject1) => {
                ejs.renderFile(filePath, projectInfo, {}, (err, result) => {
                  if (err) {
                    reject1(err)
                  }
                  // 没有写入,返回字符串
                  fse.writeFileSync(filePath, result)
                  resolve1(result)
                })
              })
            })
          )
            .then(() => resolve())
            .catch((err) => reject(err))
        }
      )
    })
  }
  async installNormalTemplate() {
    log.verbose('templateNpm', this.templateNpm)
    // 拷贝模版代码至当前目录
    const spinner = spinnerStart('正在安装模版...')
    await sleep()
    try {
      const templatePath = path.resolve(this.templateNpm.cacheFilePath, 'template')
      const targetPath = process.cwd()
      fse.ensureDirSync(templatePath)
      fse.ensureDirSync(targetPath)
      fse.copySync(templatePath, targetPath)
    } catch (e) {
      throw e
    } finally {
      spinner.stop(true)
      log.success('模版安装成功!')
    }
    const templateIgnore = this.templateInfo.ignore || []
    const ignore = ['**/node_modules/**', ...templateIgnore]
    await this.ejsRender({ ignore })
    const { installCommand, startCommand } = this.templateInfo
    // 依赖安装
    await this.execCommand(installCommand, '依赖安装过程中失败!')
    // 启动命令执行
    await this.execCommand(startCommand, '命令执行过程中失败!')
  }
  async installCustomTemplate() {
    // 查询自定义模板的入口文件
    if (await this.templateNpm.exists()) {
      const rootFile = this.templateNpm.getRootFilePath()
      if (fs.existsSync(rootFile)) {
        log.notice('开始执行自定义模板')
        const templatePath = path.resolve(this.templateNpm.cacheFilePath, 'template')
        const options = {
          templateInfo: this.templateInfo,
          projectInfo: this.projectInfo,
          sourcePath: templatePath,
          targetPath: process.cwd()
        }
        const code = `require('${rootFile}')(${JSON.stringify(options)})`
        log.verbose('code', code)
        await execAsync('node', ['-e', code], { stdio: 'inherit', cwd: process.cwd() })
        log.success('自定义模板安装成功')
      } else {
        throw new Error('自定义模板入口文件不存在！')
      }
    }
  }
  async downloadTemplate() {
    // 1. 通过项目模板API获取项目模板信息
    // 1.1 通过egg.js搭建一套后端系统
    // 1.2 通过npm存储项目模板(vue-cli/vue-element-admin)
    // 1.3 将项目模板信息存储到mongodb数据库中
    // 1.4 通过egg.js获取mongodb中的数据并返回
    const { projectTemplate } = this.projectInfo
    const templateInfo = this.template.find((item) => item.npmName === projectTemplate)
    const targetPath = path.resolve(userHome, '.tut-cli-dev', 'template')
    const storeDir = path.resolve(userHome, '.tut-cli-dev', 'template', 'node_modules')
    const { npmName, version } = templateInfo
    this.templateInfo = templateInfo
    const templateNpm = new Package({
      targetPath,
      storeDir,
      packageName: npmName,
      packageVersion: version
    })
    const hasTemplate = await templateNpm.exists()
    if (!hasTemplate) {
      const spinner = spinnerStart('正在下载模版...')
      await sleep()
      try {
        await templateNpm.install()
      } catch (e) {
        throw e
      } finally {
        spinner.stop(true)
        if (templateNpm.exists()) {
          log.success('模版下载成功!')
          this.templateNpm = templateNpm
        }
      }
    } else {
      const spinner = spinnerStart('正在更新模版...')
      try {
        await sleep()
        await templateNpm.update()
      } catch (e) {
        throw e
      } finally {
        spinner.stop(true)
        if (templateNpm.exists()) {
          log.success('模版更新成功!')
          this.templateNpm = templateNpm
        }
      }
    }
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
    function isValidName(name) {
      return /^[a-zA-Z]+(-[a-zA-Z][a-zA-Z0-9]*|_[a-zA-Z][a-zA-Z0-9]*|[a-zA-Z0-9])*$/.test(name)
    }
    let projectInfo = {}
    let isProjectNameValid = false
    if (isValidName(this.projectName)) {
      isProjectNameValid = true
      projectInfo.projectName = this.projectName
    }
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
    this.template = this.template.filter((template) => template.tag.includes(type))
    // 4. 获取项目的基本信息
    const title = type === TYPE_PROJECT ? '项目' : '组件'
    const projectNamePrompt = {
      type: 'input',
      name: 'projectName',
      message: `请输入${title}名称`,
      validate: function (v) {
        // 1. 输入的首字符必须为英文字符
        // 2. 尾字符必须为英文或数字, 不能为字符
        // 3. 字符仅仅允许'-_'

        // tip
        const done = this.async()
        setTimeout(() => {
          if (!isValidName(v)) {
            done(`请输入合法的${title}名称`)
            return
          }
          done(null, true)
        }, 0)
      }
    }
    const projectPrompt = [
      {
        type: 'input',
        name: 'projectVersion',
        message: `请输入${title}版本号`,
        default: '1.0.0',
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
        message: `请选择${title}模板`,
        choices: this.createTemplateChoices()
      }
    ]
    if (!isProjectNameValid) {
      projectPrompt.unshift(projectNamePrompt)
    }
    if (type === TYPE_PROJECT) {
      const project = await inquirer.prompt(projectPrompt)
      projectInfo = {
        ...projectInfo,
        type,
        ...project
      }
    } else if (type === TYPE_COMPONENT) {
      const descriptionPrompt = {
        type: 'input',
        name: 'componentDescription',
        message: '请输入组件描述信息',
        validate: function (v) {
          const done = this.async()
          setTimeout(() => {
            if (!v) {
              done('请输入组件描述信息')
              return
            }
            done(null, true)
          }, 0)
        }
      }
      projectPrompt.push(descriptionPrompt)
      const component = await inquirer.prompt(projectPrompt)
      projectInfo = {
        ...projectInfo,
        type,
        ...component
      }
    }
    // AbcEfg => abc-efg 生成className
    if (projectInfo.projectName) {
      projectInfo.name = projectInfo.projectName
      projectInfo.className = require('kebab-case')(projectInfo.projectName).replace(/^-/, '')
    }
    if (projectInfo.projectVersion) {
      projectInfo.version = projectInfo.projectVersion
    }
    if (projectInfo.componentDescription) {
      projectInfo.description = projectInfo.componentDescription
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
