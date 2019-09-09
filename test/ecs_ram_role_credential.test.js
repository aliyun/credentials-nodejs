'use strict';

const expect = require('expect.js');
const Credentials = require('../lib/credentials');
const mm = require('mm');
const utils = require('../lib/util/utils');
const http = require('../lib/util/http');
const defaultConfig = {
  type: 'ecs_ram_role',
  role_name: 'role_name'
};

describe('EcsRamRoleCredential with correct config', function () {
  const cred = new Credentials(defaultConfig);
  before(function () {
    mm(http, 'request', function () {
      return {
        RequestId: '76C9056D-0E40-4ED9-A82E-D69B30E733C8',
        Credentials: {
          AccessKeySecret: 'AccessKeySecret',
          AccessKeyId: 'AccessKeyId',
          Expiration: utils.timestamp(new Date(), 1000 * 3600),
          SecurityToken: 'SecurityToken'
        }
      };
    });
  });
  after(function () {
    mm.restore();
  });
  it('should success', async function () {
    let id = await cred.getAccessKeyId();
    expect(id).to.be('AccessKeyId');
    let secret = await cred.getAccessKeySecret();
    expect(secret).to.be('AccessKeySecret');
    let token = await cred.getSecurityToken();
    expect(token).to.be('SecurityToken');
    let type = cred.getType();
    expect(type).to.be('ecs_ram_role');
  });
  it('should refresh credentials with  sessionCredential expired', async function () {
    cred.sessionCredential.Expiration = utils.timestamp(cred.sessionCredential.Expiration, -1100 * 3600);
    let needRefresh = cred.needUpdateCredential();
    expect(needRefresh).to.be(true);
    let token = await cred.getSecurityToken();
    expect(token).to.be('SecurityToken');
  });
  it('should refresh credentials with no sessionCredential', async function () {
    cred.sessionCredential = null;
    let needRefresh = cred.needUpdateCredential();
    expect(needRefresh).to.be(true);
    let secret = await cred.getAccessKeySecret();
    expect(secret).to.be('AccessKeySecret');
    let id = await cred.getAccessKeyId();
    expect(id).to.be('AccessKeyId');
  });
});
describe('EcsRamRoleCredential should filed with invalid config ', function () {
  it('should faild when config has no role_name', async function () {
    let error = '';
    try {
      await new Credentials({
        type: 'ecs_ram_role',
      });
    } catch (e) {
      error = e.message;
    }
    expect(error).to.be('Missing required role_name option in config for ecs_ram_role');
  });
});


