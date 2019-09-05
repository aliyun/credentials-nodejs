'use strict';
const kitx = require('kitx');
const ini = require('ini');
const fs = require('fs');

function timestamp(dateStr, timeChange) {
  var date = new Date(dateStr);
  if (!dateStr || isNaN(date.getTime())) {
    date = new Date();
  }
  if (timeChange) {
    date.setTime(date.getTime() + timeChange);
  }
  var YYYY = date.getUTCFullYear();
  var MM = kitx.pad2(date.getUTCMonth() + 1);
  var DD = kitx.pad2(date.getUTCDate());
  var HH = kitx.pad2(date.getUTCHours());
  var mm = kitx.pad2(date.getUTCMinutes());
  var ss = kitx.pad2(date.getUTCSeconds());
  // 删除掉毫秒部分
  return `${YYYY}-${MM}-${DD}T${HH}:${mm}:${ss}Z`;
}

function parseFile(file, ignoreErr) {
  // check read permission
  try {
    fs.accessSync(file, fs.constants.R_OK);
  } catch (e) {
    if (ignoreErr) {
      return null;
    }
    throw new Error('Has no read permission to credentials file');
  }
  const content = ini.parse(fs.readFileSync(file, 'utf-8'));
  return content;
}

module.exports = {
  timestamp: timestamp,
  parseFile: parseFile
};