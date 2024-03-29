

import expect from 'expect.js';
import { request } from '../src/util/http';
import mm from 'mm';
import httpx from 'httpx';
import rewire from 'rewire';
import 'mocha';

const mock = (response: any, body: any) => {
  before(function () {
    mm(httpx, 'request', async function (url: string, opts: {[key: string]: any}) {
      return response;
    });

    mm(httpx, 'read', async function (response: any, encoding: string) {
      return body;
    });
  });

  after(function () {
    mm.restore();
  });
};

describe('http request', function () {
  mock({}, '{}');

  it('should success', async function () {
    let result = await request('https://sts.aliyuncs.com', {
      accessKeyId: 'accessKeyId',
      roleArn: 'roleArn',
      action: 'action',
      durationSeconds: 3600,
      roleSessionName: 'defaultSessionName',
    }, {}, 'accessKeySecret');
    expect(result).to.be.ok();
  });
});

describe('http request', function () {
  mock({}, '{}');

  it('should success with undefined params', async function () {
    let result = await request('https://sts.aliyuncs.com', {
      accessKeyId: 'accessKeyId',
      roleArn: 'roleArn',
      action: 'action',
      durationSeconds: 3600,
      roleSessionName: 'defaultSessionName',
      testParams: [
        { testKey: 'testKey1' },
        { testKey: 'testKey2' },
        { testKey: 'testKey3' },
        'testValue1', 'testValue2'
      ]
    }, undefined, 'accessKeySecret');
    expect(result).to.be.ok();
  });

  it('should success with undefined option', async function () {
    let result = await request('https://sts.aliyuncs.com', undefined, undefined, 'accessKeySecret');
    expect(result).to.be.ok();
  });

  it('should success with POST method', async function () {
    let host = 'https://sts.aliyuncs.com';
    let params = {
      accessKeyId: 'accessKeyId',
      roleArn: 'roleArn',
      action: 'action',
      durationSeconds: 3600,
      roleSessionName: 'defaultSessionName',
      testParams: [
        { testKey: 'testKey1' },
        { testKey: 'testKey2' },
        { testKey: 'testKey3' },
        'testValue1', 'testValue2'
      ]
    };
    let options = {
      method: 'POST',
      formatParams: false,
      headers: {
        content_type: 'application/x-www-form-urlencoded'
      }
    };
    let key = 'accessKeySecret';
    let result = await request(host, params, options, key);
    expect(result).to.be.ok();
  });

  it('should success with POST method and no headers', async function () {
    let host = 'https://sts.aliyuncs.com';
    let params = {
      accessKeyId: 'accessKeyId',
      roleArn: 'roleArn',
      action: 'action',
      durationSeconds: 3600,
      roleSessionName: 'defaultSessionName',
      testParams: [
        { testKey: 'testKey1' },
        { testKey: 'testKey2' },
        { testKey: 'testKey3' },
        'testValue1', 'testValue2'
      ]
    };
    let options: {[key: string]: any} = {
      method: 'POST',
      formatParams: false,
      headers: undefined
    };
    let key = 'accessKeySecret';
    let result = await request(host, params, options, key);
    expect(result).to.be.ok();
  });
});

describe('http request', function () {
  it('should failed with invalid accessKeyId', async function () {
    let error = '';
    try {
      let accessKeySecret = 'accessKeySecret';
      await request('https://sts.aliyuncs.com', {
        accessKeyId: 'accessKeyId',
        roleArn: 'roleArn',
        action: 'AssumeRole',
        durationSeconds: 3600,
        roleSessionName: 'defaultSessionName',
      }, {}, accessKeySecret);
    } catch (e) {
      error = e.name;
    }
    expect(error).to.be('InvalidAccessKeyId.NotFoundError');
  });
});

describe('http private methods', function () {
  const http = rewire('../src/util/http');

  it('firstLetterUpper should ok', function () {
    const firstLetterUpper = http.__get__('firstLetterUpper');
    expect(firstLetterUpper('hello')).to.be('Hello');
  });

  it('formatParams should ok', function () {
    const formatParams = http.__get__('formatParams');
    expect(formatParams({ 'hello': 'world' })).to.be.eql({
      Hello: 'world'
    });
  });

  it('encode should ok', function () {
    const encode = http.__get__('encode');
    expect(encode('str')).to.be('str');
    expect(encode('str\'str')).to.be('str%27str');
    expect(encode('str(str')).to.be('str%28str');
    expect(encode('str)str')).to.be('str%29str');
    expect(encode('str*str')).to.be('str%2Astr');
  });

  it('replaceRepeatList should ok', function () {
    const replaceRepeatList = http.__get__('replaceRepeatList');
    function helper(target: {[key: string]: any}, key: string, repeat: any) {
      replaceRepeatList(target, key, repeat);
      return target;
    }
    expect(helper({}, 'key', [])).to.be.eql({});
    expect(helper({}, 'key', ['value'])).to.be.eql({
      'key.1': 'value'
    });
    expect(helper({}, 'key', [{
      Domain: '1.com'
    }])).to.be.eql({
      'key.1.Domain': '1.com'
    });
  });

  it('flatParams should ok', function () {
    const flatParams = http.__get__('flatParams');
    expect(flatParams({})).to.be.eql({});
    expect(flatParams({ key: ['value'] })).to.be.eql({
      'key.1': 'value'
    });
    expect(flatParams({
      'key': 'value'
    })).to.be.eql({
      'key': 'value'
    });
    expect(flatParams({
      key: [
        {
          Domain: '1.com'
        }
      ]
    })).to.be.eql({
      'key.1.Domain': '1.com'
    });
  });

  it('normalize should ok', function () {
    const normalize = http.__get__('normalize');
    expect(normalize({})).to.be.eql([]);
    expect(normalize({ key: ['value'] })).to.be.eql([
      ['key.1', 'value']
    ]);
    expect(normalize({
      'key': 'value'
    })).to.be.eql([
      ['key', 'value']
    ]);
    expect(normalize({
      key: [
        {
          Domain: '1.com'
        }
      ]
    })).to.be.eql([
      ['key.1.Domain', '1.com']
    ]);
    expect(normalize({
      'a': 'value',
      'c': 'value',
      'b': 'value'
    })).to.be.eql([
      ['a', 'value'],
      ['b', 'value'],
      ['c', 'value']
    ]);
  });

  it('canonicalize should ok', function () {
    const canonicalize = http.__get__('canonicalize');
    expect(canonicalize([])).to.be('');
    expect(canonicalize([
      ['key.1', 'value']
    ])).to.be('key.1=value');
    expect(canonicalize([
      ['key', 'value']
    ])).to.be('key=value');
    expect(canonicalize([
      ['key.1.Domain', '1.com']
    ])).to.be('key.1.Domain=1.com');
    expect(canonicalize([
      ['a', 'value'],
      ['b', 'value'],
      ['c', 'value']
    ])).to.be('a=value&b=value&c=value');
  });
});
