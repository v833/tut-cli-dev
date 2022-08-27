const request = require('@tut-cli-dev/request')

module.exports = function () {
  return request({
    url: '/project/template'
  })
}
