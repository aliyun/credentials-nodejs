import expect from 'expect.js';
import EcsRamRoleCredential from '../src/ecs_ram_role_credential';
import mm from 'mm';
import * as utils from '../src/util/utils';
const REQUEST_URL = 'http://100.100.100.200/latest/meta-data/ram/security-credentials/';
import 'mocha';
import httpx from 'httpx';

const mock = () => {
  before(function () {
    mm(httpx, 'request', async function (url: string, opts: {[key: string]: any}) {
      if (url === REQUEST_URL) {
        return {body: 'tem_role_name'};
      }

      let result = {
        RequestId: '76C9056D-0E40-4ED9-A82E-D69B30E733C8',
        AccessKeySecret: 'AccessKeySecret',
        AccessKeyId: 'AccessKeyId',
        Expiration: utils.timestamp(new Date(), 1000 * 3600),
        SecurityToken: 'SecurityToken'
      };

      if (url === (REQUEST_URL + 'tem_role_name')) {
        result = {
          RequestId: '76C9056D-0E40-4ED9-A82E-D69B30E733C8',
          AccessKeySecret: 'temAccessKeySecret',
          AccessKeyId: 'temAccessKeyId',
          Expiration: utils.timestamp(new Date(), 1000 * 3600),
          SecurityToken: 'temSecurityToken'
        };
      }

      return {body: JSON.stringify(result)};
    });

    mm(httpx, 'read', async function (response: any, encoding: string) {
      return response.body;
    });
  });

  after(function () {
    mm.restore();
  });
};

describe('EcsRamRoleCredential with role_name', function () {
  const cred = new EcsRamRoleCredential('roleName');

  mock();

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

  it('should refresh credentials with sessionCredential expired', async function () {
    cred.sessionCredential.Expiration = utils.timestamp(cred.sessionCredential.Expiration, -1000 * 3600);
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

describe('EcsRamRoleCredential with no role_name', function () {
  const cred = new EcsRamRoleCredential();

  mock();

  it('should success', async function () {
    let id = await cred.getAccessKeyId();
    expect(id).to.be('temAccessKeyId');
    let secret = await cred.getAccessKeySecret();
    expect(secret).to.be('temAccessKeySecret');
    let token = await cred.getSecurityToken();
    expect(token).to.be('temSecurityToken');
    let type = cred.getType();
    expect(type).to.be('ecs_ram_role');
  });

  it('should refresh credentials with sessionCredential expired', async function () {
    cred.sessionCredential.Expiration = utils.timestamp(cred.sessionCredential.Expiration, -1000 * 3600);
    let needRefresh = cred.needUpdateCredential();
    expect(needRefresh).to.be(true);
    let token = await cred.getSecurityToken();
    expect(token).to.be('temSecurityToken');
  });

  it('should refresh credentials with no sessionCredential', async function () {
    cred.sessionCredential = null;
    let needRefresh = cred.needUpdateCredential();
    expect(needRefresh).to.be(true);
    let secret = await cred.getAccessKeySecret();
    expect(secret).to.be('temAccessKeySecret');
    let id = await cred.getAccessKeyId();
    expect(id).to.be('temAccessKeyId');
  });
});
