

import httpx from 'httpx';
import * as kitx from 'kitx';
import * as helper from './helper';
import * as utils from './utils';

const STATUS_CODE = new Set([200, '200', 'OK', 'Success']);

function firstLetterUpper(str: string): string {
  return str.slice(0, 1).toUpperCase() + str.slice(1);
}

function formatParams(params: { [key: string]: any }): { [key: string]: any } {
  const keys = Object.keys(params);
  const newParams: { [key: string]: string } = {};
  for (const key of keys) {
    newParams[firstLetterUpper(key)] = params[key];
  }
  return newParams;
}

function encode(str: string): string {
  const result = encodeURIComponent(str);

  return result.replace(/!/g, '%21')
    .replace(/'/g, '%27')
    .replace(/\(/g, '%28')
    .replace(/\)/g, '%29')
    .replace(/\*/g, '%2A');
}

function replaceRepeatList(target: { [key: string]: any }, key: string, repeat: any) {
  for (let i = 0; i < repeat.length; i++) {
    const item = repeat[i];

    if (item && typeof item === 'object') {
      const keys = Object.keys(item);
      for (const itemKey of keys) {
        target[`${key}.${i + 1}.${itemKey}`] = item[itemKey];
      }
    } else {
      target[`${key}.${i + 1}`] = item;
    }
  }
}

function flatParams(params: { [key: string]: any }): { [key: string]: any } {
  const target: { [key: string]: any } = {};
  const keys = Object.keys(params);
  for (const key of keys) {
    const value = params[key];
    if (Array.isArray(value)) {
      replaceRepeatList(target, key, value);
    } else {
      target[key] = value;
    }
  }
  return target;
}

function normalize(params: { [key: string]: any }): string[][] {
  const list = [];
  const flated = flatParams(params);
  const keys = Object.keys(flated).sort();
  for (const key of keys) {
    const value = flated[key];
    list.push([encode(key), encode(value)]); // push []
  }
  return list;
}

function canonicalize(normalized: string[][]): string {
  const fields = [];
  for (const [key, value] of normalized) {
    fields.push(key + '=' + value);
  }
  return fields.join('&');
}

function _buildParams(): { [key: string]: any } {
  const defaultParams = {
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

export async function request(host: string, params: { [key: string]: any } = {}, opts: { [key: string]: any } = {}, accessKeySecret?: string): Promise<any> {
  // 1. compose params and opts
  let options: { [key: string]: any } = {
    headers: {
      'x-sdk-client': helper.DEFAULT_CLIENT,
      'user-agent': helper.DEFAULT_UA
    },
    ...opts
  };

  // format params until formatParams is false
  if (options.formatParams !== false) {
    params = formatParams(params);
  }
  params = {
    ..._buildParams(),
    ...params
  };

  // 2. calculate signature
  const method = (opts.method || 'GET').toUpperCase();
  const normalized = normalize(params);
  if (!options.anonymous) {
    const canonicalized = canonicalize(normalized);
    // 2.1 get string to sign
    const stringToSign = `${method}&${encode('/')}&${encode(canonicalized)}`;
    // 2.2 get signature
    const key = accessKeySecret + '&';
    const signature = kitx.sha1(stringToSign, key, 'base64') as string;
    // add signature
    normalized.push(['Signature', encode(signature)]);
  }
  // 3. generate final url
  const url = opts.method === 'POST' ? `${host}/` : `${host}/?${canonicalize(normalized)}`;
  // 4. send request
  if (opts.method === 'POST') {
    opts.headers = opts.headers || {};
    opts.headers['content-type'] = 'application/x-www-form-urlencoded';
    opts.data = canonicalize(normalized);
  }
  const response = await httpx.request(url, opts);
  const buffer = await httpx.read(response, 'utf8');
  const json = JSON.parse(buffer as string);
  if (json.Code && !STATUS_CODE.has(json.Code)) {
    const err = new Error(`${json.Message}`) as any;
    err.name = json.Code + 'Error';
    err.data = json;
    err.code = json.Code;
    err.url = url;
    throw err;
  }
  return json;
}
