'use strict';

const httpx = require('httpx');
const httpModule = require('https');
const kitx = require('kitx');
const JSON = require('json-bigint');
const utils = require('./utils');

const helper = require('./helper');
const STATUS_CODE = new Set([200, '200', 'OK', 'Success']);

function firstLetterUpper(str) {
  return str.slice(0, 1).toUpperCase() + str.slice(1);
}

function formatParams(params) {
  let keys = Object.keys(params);
  let newParams = {};
  for (let i = 0; i < keys.length; i++) {
    let key = keys[i];
    newParams[firstLetterUpper(key)] = params[key];
  }
  return newParams;
}

function encode(str) {
  let result = encodeURIComponent(str);

  return result.replace(/!/g, '%21')
    .replace(/'/g, '%27')
    .replace(/\(/g, '%28')
    .replace(/\)/g, '%29')
    .replace(/\*/g, '%2A');
}

function replaceRepeatList(target, key, repeat) {
  for (let i = 0; i < repeat.length; i++) {
    let item = repeat[i];

    if (item && typeof item === 'object') {
      const keys = Object.keys(item);
      for (let j = 0; j < keys.length; j++) {
        target[`${key}.${i + 1}.${keys[j]}`] = item[keys[j]];
      }
    } else {
      target[`${key}.${i + 1}`] = item;
    }
  }
}

function flatParams(params) {
  let target = {};
  let keys = Object.keys(params);
  for (let i = 0; i < keys.length; i++) {
    let key = keys[i];
    let value = params[key];
    if (Array.isArray(value)) {
      replaceRepeatList(target, key, value);
    } else {
      target[key] = value;
    }
  }
  return target;
}

function normalize(params) {
  let list = [];
  let flated = flatParams(params);
  let keys = Object.keys(flated).sort();
  for (let i = 0; i < keys.length; i++) {
    let key = keys[i];
    let value = flated[key];
    list.push([encode(key), encode(value)]); //push []
  }
  return list;
}

function canonicalize(normalized) {
  let fields = [];
  for (let i = 0; i < normalized.length; i++) {
    let [key, value] = normalized[i];
    fields.push(key + '=' + value);
  }
  return fields.join('&');
}

function _buildParams() {
  let defaultParams = {
    Format: 'JSON',
    SignatureMethod: 'HMAC-SHA1',
    SignatureNonce: kitx.makeNonce(),
    SignatureVersion: '1.0',
    Timestamp: utils.timestamp(),
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
    let defaults = _buildParams();
    params = Object.assign(defaults, params);

    // 2. calculate signature
    let method = (opts.method || 'GET').toUpperCase();
    let normalized = normalize(params);
    let canonicalized = canonicalize(normalized);
    // 2.1 get string to sign
    let stringToSign = `${method}&${encode('/')}&${encode(canonicalized)}`;
    // 2.2 get signature
    const key = accessKeySecret + '&';
    let signature = kitx.sha1(stringToSign, key, 'base64');
    // add signature
    normalized.push(['Signature', encode(signature)]);
    // 3. generate final url
    const url = opts.method === 'POST' ? `${host}/` : `${host}/?${canonicalize(normalized)}`;
    // 4. send request

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
    const buffer = await httpx.read(response, 'utf8');
    let json = JSON.parse(buffer);
    if (json.Code && !STATUS_CODE.has(json.Code)) {
      let err = new Error(`${json.Message}`);
      err.name = json.Code + 'Error';
      err.data = json;
      err.code = json.Code;
      err.url = url;
      throw err;
    }
    return json;
  }
};
