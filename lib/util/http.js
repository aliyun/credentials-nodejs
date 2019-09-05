'use strict';

const httpx = require('httpx');
const httpModule = require('https');
const kitx = require('kitx');
const JSON = require('json-bigint');

const helper = require('./helper');
const STATUS_CODE = new Set([200, '200', 'OK', 'Success']);

function firstLetterUpper(str) {
  return str.slice(0, 1).toUpperCase() + str.slice(1);
}

function formatParams(params) {
  var keys = Object.keys(params);
  var newParams = {};
  for (var i = 0; i < keys.length; i++) {
    var key = keys[i];
    newParams[firstLetterUpper(key)] = params[key];
  }
  return newParams;
}


function timestamp() {
  var date = new Date();
  var YYYY = date.getUTCFullYear();
  var MM = kitx.pad2(date.getUTCMonth() + 1);
  var DD = kitx.pad2(date.getUTCDate());
  var HH = kitx.pad2(date.getUTCHours());
  var mm = kitx.pad2(date.getUTCMinutes());
  var ss = kitx.pad2(date.getUTCSeconds());
  // 删除掉毫秒部分
  return `${YYYY}-${MM}-${DD}T${HH}:${mm}:${ss}Z`;
}

function encode(str) {
  var result = encodeURIComponent(str);

  return result.replace(/!/g, '%21')
    .replace(/'/g, '%27')
    .replace(/\(/g, '%28')
    .replace(/\)/g, '%29')
    .replace(/\*/g, '%2A');
}

function replaceRepeatList(target, key, repeat) {
  for (var i = 0; i < repeat.length; i++) {
    var item = repeat[i];

    if (item && typeof item === 'object') {
      const keys = Object.keys(item);
      for (var j = 0; j < keys.length; j++) {
        target[`${key}.${i + 1}.${keys[j]}`] = item[keys[j]];
      }
    } else {
      target[`${key}.${i + 1}`] = item;
    }
  }
}

function flatParams(params) {
  var target = {};
  var keys = Object.keys(params);
  for (let i = 0; i < keys.length; i++) {
    var key = keys[i];
    var value = params[key];
    if (Array.isArray(value)) {
      replaceRepeatList(target, key, value);
    } else {
      target[key] = value;
    }
  }
  return target;
}

function normalize(params) {
  var list = [];
  var flated = flatParams(params);
  var keys = Object.keys(flated).sort();
  for (let i = 0; i < keys.length; i++) {
    var key = keys[i];
    var value = flated[key];
    list.push([encode(key), encode(value)]); //push []
  }
  return list;
}

function canonicalize(normalized) {
  var fields = [];
  for (var i = 0; i < normalized.length; i++) {
    var [key, value] = normalized[i];
    fields.push(key + '=' + value);
  }
  return fields.join('&');
}

function _buildParams() {
  var defaultParams = {
    Format: 'JSON',
    SignatureMethod: 'HMAC-SHA1',
    SignatureNonce: kitx.makeNonce(),
    SignatureVersion: '1.0',
    Timestamp: timestamp(),
    Version: '2015-04-01',
    RegionId: 'cn-hangzhou'

  };
  return defaultParams;
}


module.exports = {
  request: async function (host, params = {}, opts = {}, accessKeySecret) {
    // 1. compose params and opts
    opts = Object.assign({
      headers: {
        'x-sdk-client': helper.DEFAULT_CLIENT,
        'user-agent': helper.DEFAULT_UA
      }
    }, opts);

    // format params until formatParams is false
    if (opts.formatParams !== false) {
      params = formatParams(params);
    }
    var defaults = _buildParams();
    params = Object.assign(defaults, params);

    // 2. caculate signature
    var method = (opts.method || 'GET').toUpperCase();
    var normalized = normalize(params);
    var canonicalized = canonicalize(normalized);
    // 2.1 get string to sign
    var stringToSign = `${method}&${encode('/')}&${encode(canonicalized)}`;
    // 2.2 get signature
    const key = accessKeySecret + '&';
    var signature = kitx.sha1(stringToSign, key, 'base64');
    // add signature
    normalized.push(['Signature', encode(signature)]);
    // 3. generate final url
    const url = opts.method === 'POST' ? `${host}/` : `${host}/?${canonicalize(normalized)}`;
    // 4. send request
    var entry = {
      url: url,
      request: null,
      response: null
    };

    if (opts && !opts.agent) {
      opts.agent = new httpModule.Agent({
        keepAlive: true,
        keepAliveMsecs: 3000
      });
    }

    if (opts.method === 'POST') {
      opts.headers = opts.headers || {};
      opts.headers['content-type'] = 'application/x-www-form-urlencoded';
      opts.data = canonicalize(normalized);
    }
    const response = await httpx.request(url, opts);
    entry.request = {
      headers: response.req._headers
    };
    entry.response = {
      statusCode: response.statusCode,
      headers: response.headers
    };
    const buffer = await httpx.read(response, 'utf8');
    var json = JSON.parse(buffer);
    if (json.Code && !STATUS_CODE.has(json.Code)) {
      var err = new Error(`${json.Message}, URL: ${url}`);
      err.name = json.Code + 'Error';
      err.data = json;
      err.code = json.Code;
      err.url = url;
      err.entry = entry;
      throw err;
    }
    return json;
  }
};
