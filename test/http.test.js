'use strict';

const expect = require('expect.js');
const http = require('../lib//util/http');
const mm = require('mm');
const httpx = require('httpx');


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
    }, {}, 'keaccessKeySecret');
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
        formatParams: true,
      },
      'keaccessKeySecret');
    expect(result).to.be.ok();
  });
});
describe('http request', function () {
  before(function () {
  });
  after(function () {
    mm.restore();
  });
  it('should faild with invalid accessKeyId', async function () {
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




