/*
 * @Description:
 * @Author: wangqun
 * @Date: 2022-08-16 22:34:41
 * @LastEditors: wangqun
 * @LastEditTime: 2022-08-17 21:14:13
 */
'use strict'

function isObject(obj) {
  return Object.prototype.toString.call(obj) === '[object Object]'
}

function spinnerStart(message, spinnerString = '|/-\\') {
  const Spinner = require('cli-spinner').Spinner
  const spinner = new Spinner(message + ' %s')
  spinner.setSpinnerString(spinnerString)
  spinner.start()
  return spinner
}

async function sleep(timeout = 1000) {
  return await new Promise((resolve) => setTimeout(resolve, timeout))
}

module.exports = {
  isObject,
  spinnerStart,
  sleep
}
