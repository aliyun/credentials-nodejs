'use strict';

const expect = require('expect.js');
const http = require('../lib//util/http');
const mm = require('mm');
const httpx = require('httpx');
const https = require('https');


describe('http request', function () {
  before(function () {
    mm(httpx, 'read', function () {
      return '{"RequestId":"RequestId","AssumedRoleUser":{"AssumedRoleId":"AssumedRoleId","Arn":"Arn"},"Credentials":{"AccessKeySecret":"AccessKeySecret","AccessKeyId":"AccessKeyId","Expiration":"2019-09-04T08:48:36Z","SecurityToken":"SecurityToken"}}';
    });
  });
  after(function () {
    mm.restore();
  });
  it('should success', async function () {
    let result = await http.request('https://sts.aliyuncs.com', {
      accessKeyId: 'accessKeyId',
      roleArn: 'roleArn',
      action: 'action',
      DurationSeconds: 3600,
      roleSessionName: 'defaultSessionName',
    }, {}, 'accessKeySecret');
    expect(result).to.be.ok();
  });
});
describe('http request', function () {
  before(function () {
    mm(httpx, 'read', function () {
      return '{"RequestId":"RequestId","AssumedRoleUser":{"AssumedRoleId":"AssumedRoleId","Arn":"Arn"},"Credentials":{"AccessKeySecret":"AccessKeySecret","AccessKeyId":"AccessKeyId","Expiration":"2019-09-04T08:48:36Z","SecurityToken":"SecurityToken"}}';
    });
  });
  after(function () {
    mm.restore();
  });
  it('should success with undefined params', async function () {
    let result = await http.request('https://sts.aliyuncs.com', {
      accessKeyId: 'accessKeyId',
      roleArn: 'roleArn',
      action: 'action',
      DurationSeconds: 3600,
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
    let result = await http.request('https://sts.aliyuncs.com', undefined, undefined, 'accessKeySecret');
    expect(result).to.be.ok();
  });
  it('should success with POST method', async function () {
    let result = await http.request('https://sts.aliyuncs.com', {
      accessKeyId: 'accessKeyId',
      roleArn: 'roleArn',
      action: 'action',
      DurationSeconds: 3600,
      roleSessionName: 'defaultSessionName',
      testParams: [
        { testKey: 'testKey1' },
        { testKey: 'testKey2' },
        { testKey: 'testKey3' },
        'testValue1', 'testValue2'
      ]
    }, {
        method: 'POST',
        formatParams: false,
        headers: {
          content_type: 'application/x-www-form-urlencoded'
        },
        agent: new https.Agent({
          keepAlive: true,
          keepAliveMsecs: 3000
        })

      },
      'accessKeySecret');
    expect(result).to.be.ok();
  });
  it('should success with POST method and no headers', async function () {
    let result = await http.request('https://sts.aliyuncs.com', {
      accessKeyId: 'accessKeyId',
      roleArn: 'roleArn',
      action: 'action',
      DurationSeconds: 3600,
      roleSessionName: 'defaultSessionName',
      testParams: [
        { testKey: 'testKey1' },
        { testKey: 'testKey2' },
        { testKey: 'testKey3' },
        'testValue1', 'testValue2'
      ]
    }, {
        method: 'POST',
        formatParams: false,
        headers: undefined,
        agent: new https.Agent({
          keepAlive: true,
          keepAliveMsecs: 3000
        })

      },
      'accessKeySecret');
    expect(result).to.be.ok();
  });
});
describe('http request', function () {
  it('should failed with invalid accessKeyId', async function () {
    let error = '';
    try {
      let accessKeySecret = 'accessKeySecret';
      await http.request('https://sts.aliyuncs.com', {
        accessKeyId: 'accessKeyId',
        roleArn: 'roleArn',
        action: 'AssumeRole',
        DurationSeconds: 3600,
        roleSessionName: 'defaultSessionName',
      }, {}, accessKeySecret);
    } catch (e) {
      error = e.name;
    }
    expect(error).to.be('InvalidAccessKeyId.NotFoundError');
  });
});




