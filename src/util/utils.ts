'use strict';

import * as ini from 'ini';
import * as kitx from 'kitx';
import * as fs from 'fs';

export function timestamp(dateStr: string, timeChange: number): string {
  let date = new Date(dateStr);
  if (!dateStr || isNaN(date.getTime())) {
    date = new Date();
  }
  if (timeChange) {
    date.setTime(date.getTime() + timeChange);
  }
  let YYYY = date.getUTCFullYear();
  let MM = kitx.pad2(date.getUTCMonth() + 1);
  let DD = kitx.pad2(date.getUTCDate());
  let HH = kitx.pad2(date.getUTCHours());
  let mm = kitx.pad2(date.getUTCMinutes());
  let ss = kitx.pad2(date.getUTCSeconds());
  // 删除掉毫秒部分
  return `${YYYY}-${MM}-${DD}T${HH}:${mm}:${ss}Z`;
}

export function parseFile(file: string, ignoreErr: boolean): any {
  // check read permission
  try {
    fs.accessSync(file, fs.constants.R_OK);
  } catch (e) {
    if (ignoreErr) {
      return null;
    }
    throw new Error('Has no read permission to credentials file');
  }
  return ini.parse(fs.readFileSync(file, 'utf-8'));
}
