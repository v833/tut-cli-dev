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

module.exports = {
  isObject
}
