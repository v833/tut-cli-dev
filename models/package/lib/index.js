// 'use strict'
const path = require('path')
const pkgDir = require('pkg-dir').sync
const npminstall = require('npminstall')
const pathExists = require('path-exists').sync
const fsExtra = require('fs-extra')

const { isObject } = require('@tut-cli-dev/utils')
const formatPath = require('@tut-cli-dev/format-path')
const { getDefaultRegistry, getNpmLastestVersion } = require('@tut-cli-dev/get-npm-info')

class Package {
  constructor(options) {
    if (!options) {
      throw new Error('Package类的参数不能为空!')
    }
    if (!isObject(options)) {
      throw new Error('Package类的options参数必须为对象!')
    }
    this.targetPath = options.targetPath
    // 缓存package的路径
    this.storeDir = options.storeDir
    this.packageName = options.packageName
    this.packageVersion = options.packageVersion
    // package缓存目录前缀
    this.cacheFilePathPrefix = this.packageName.replace(/\//g, '_')
  }
  async prepare() {
    // 确保目录存在
    if (this.storeDir && !pathExists(this.storeDir)) {
      fsExtra.mkdirpSync(this.storeDir)
    }
    if (this.packageVersion === 'lastest') {
      this.packageVersion = await getNpmLastestVersion(this.packageName)
    }
  }
  get cacheFilePath() {
    return path.resolve(
      this.storeDir,
      `_${this.cacheFilePathPrefix}@${this.packageVersion}@${this.packageName}`
    )
  }
  getSpecificCacheFilePath(packageVersion) {
    return path.resolve(
      this.storeDir,
      `_${this.cacheFilePathPrefix}@${packageVersion}@${this.packageName}`
    )
  }
  // 判断package是否存在
  async exists() {
    if (this.storeDir) {
      await this.prepare()
      return pathExists(this.cacheFilePath)
    } else {
      return pathExists(this.targetPath)
    }
  }
  async install() {
    await this.prepare()
    return npminstall({
      root: this.targetPath,
      storeDir: this.storeDir,
      registry: getDefaultRegistry(true),
      pkgs: [{ name: this.packageName, version: this.packageVersion }]
    })
  }
  async update() {
    await this.prepare()
    // 1. 获取最新npm模块版本号
    const latestPackageVersion = await getNpmLastestVersion(this.packageName)
    // 2. 查询最新版本号是否存在
    const lastestFilePath = this.getSpecificCacheFilePath(latestPackageVersion)
    // 3. 如果不存在则安装
    if (!pathExists(lastestFilePath)) {
      await npminstall({
        root: this.targetPath,
        storeDir: this.storeDir,
        registry: getDefaultRegistry(true),
        pkgs: [{ name: this.packageName, version: lastestFilePath }]
      })
      this.packageVersion = latestPackageVersion
    }
  }
  getRootFilePath() {
    function _getRootFile(targetPath) {
      // 1. 获取package.json 所在目录 pkg-dir
      const dir = pkgDir(targetPath)
      if (!dir) return null

      // 2. 读取package.json -require()
      const pkgFile = require(path.resolve(dir, 'package.json'))

      // 3. 找到package main/lib -path
      if (pkgFile && pkgFile.main) {
        // 4. 路径的兼容 (macOS/windows)
        return formatPath(path.resolve(dir, pkgFile.main))
      }
    }
    if (this.storeDir) {
      return _getRootFile(this.cacheFilePath)
    } else {
      return _getRootFile(this.targetPath)
    }
  }
}

module.exports = Package
