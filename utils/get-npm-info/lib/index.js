'use strict'

const axios = require('axios')
const urlJoin = require('url-join')
const semver = require('semver')

function getNpmInfo(npmName, registry) {
  if (!npmName) return null
  const registryUrl = registry || getDefaultRegistry(true)
  const npmInfoUrl = urlJoin(registryUrl, npmName)
  return axios
    .get(npmInfoUrl)
    .then((res) => {
      if (res.status === 200) {
        return res.data
      } else {
        return null
      }
    })
    .catch((err) => {
      throw Promise.reject(err)
    })
}

function getDefaultRegistry(isOriginal = false) {
  return isOriginal ? 'https://registry.npmjs.org' : 'https://registry.npm.taobao.org'
}

async function getNpmVersions(npmName, registry) {
  const data = await getNpmInfo(npmName, registry)
  if (!data) return []
  return Object.keys(data.versions)
}

function getSemverVersions(baseVersion, versions) {
  versions = versions
    .filter((version) => {
      return semver.satisfies(version, `^${baseVersion}`)
    })
    .sort((a, b) => semver.gt(b, a))
  return versions
}

async function getNpmSemverVersion(baseVersion, npmName, registry) {
  const versions = await getNpmVersions(npmName, registry)
  const newVersions = getSemverVersions(baseVersion, versions)
  if (newVersions && newVersions.length > 0) {
    return newVersions[0]
  }
}
async function getNpmLastestVersion(npmName, registry) {
  const versions = await getNpmVersions(npmName, registry)
  if (versions) {
    // return versions.sort((a, b) => semver.gt(b, a))[0]
    return versions.at(-1)
  }
  return null
}

module.exports = {
  getNpmInfo,
  getNpmVersions,
  getNpmSemverVersion,
  getDefaultRegistry,
  getNpmLastestVersion
}
