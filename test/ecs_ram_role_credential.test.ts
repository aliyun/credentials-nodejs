import expect from 'expect.js';
import EcsRamRoleCredential from '../src/ecs_ram_role_credential';
import mm from 'mm';
import * as utils from '../src/util/utils';
const REQUEST_URL = 'http://100.100.100.200/latest/meta-data/ram/security-credentials/';
const SECURITY_CRED_TOKEN_URL = 'http://100.100.100.200/latest/api/token';
import 'mocha';
import httpx from 'httpx';

const mock = () => {
  before(function () {
    mm(httpx, 'request', async function (url: string, opts: {[key: string]: any}) {
      if (url === REQUEST_URL) {
        return {statusCode: 200, body: 'tem_role_name'};
      }

      if (url === SECURITY_CRED_TOKEN_URL) {
        if(opts.headers['X-aliyun-ecs-metadata-token-ttl-seconds'] === '123456') {
          return {body: 'Get Token Err', statusCode: 404};
        }
        if(opts.headers['X-aliyun-ecs-metadata-token-ttl-seconds'] === '654321') {
          return {body: 'wrongToken', statusCode: 200};
        }
        return {body: 'token', statusCode: 200};
      }

      if(opts.headers['X-aliyun-ecs-metadata-token'] && opts.headers['X-aliyun-ecs-metadata-token'] !== 'token') {
        return {body: 'Token Err', statusCode: 403};
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

      return {statusCode: 200, body: JSON.stringify(result)};
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
    
    let credentialModel = await cred.getCredential();
    expect(credentialModel.accessKeyId).to.be('AccessKeyId');
    expect(credentialModel.accessKeySecret).to.be('AccessKeySecret');
    expect(credentialModel.securityToken).to.be('SecurityToken');
    expect(credentialModel.type).to.be('ecs_ram_role');
  });

  it('should refresh credentials with sessionCredential expired', async function () {
    cred.sessionCredential.Expiration = utils.timestamp(cred.sessionCredential.Expiration, -1000 * 3600);
    let needRefresh = cred.needUpdateCredential();
    expect(needRefresh).to.be(true);
    let token = await cred.getSecurityToken();
    expect(token).to.be('SecurityToken');

    cred.sessionCredential.Expiration = utils.timestamp(cred.sessionCredential.Expiration, -1000 * 3600);
    expect(cred.needUpdateCredential()).to.be(true);
    let credentialModel = await cred.getCredential();
    expect(credentialModel.securityToken).to.be('SecurityToken');
  });

  it('should refresh credentials with no sessionCredential', async function () {
    cred.sessionCredential = null;
    let needRefresh = cred.needUpdateCredential();
    expect(needRefresh).to.be(true);
    let secret = await cred.getAccessKeySecret();
    expect(secret).to.be('AccessKeySecret');
    let id = await cred.getAccessKeyId();
    expect(id).to.be('AccessKeyId');

    cred.sessionCredential = null;
    expect(cred.needUpdateCredential()).to.be(true);
    let credentialModel = await cred.getCredential();
    expect(credentialModel.accessKeyId).to.be('AccessKeyId');
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

    let credentialModel = await cred.getCredential();
    expect(credentialModel.accessKeyId).to.be('temAccessKeyId');
    expect(credentialModel.accessKeySecret).to.be('temAccessKeySecret');
    expect(credentialModel.securityToken).to.be('temSecurityToken');
    expect(credentialModel.type).to.be('ecs_ram_role');
  });

  it('should refresh credentials with sessionCredential expired', async function () {
    cred.sessionCredential.Expiration = utils.timestamp(cred.sessionCredential.Expiration, -1000 * 3600);
    let needRefresh = cred.needUpdateCredential();
    expect(needRefresh).to.be(true);
    let token = await cred.getSecurityToken();
    expect(token).to.be('temSecurityToken');

    cred.sessionCredential.Expiration = utils.timestamp(cred.sessionCredential.Expiration, -1000 * 3600);
    expect(cred.needUpdateCredential()).to.be(true);
    let credentialModel = await cred.getCredential();
    expect(credentialModel.securityToken).to.be('temSecurityToken');
  });

  it('should refresh credentials with no sessionCredential', async function () {
    cred.sessionCredential = null;
    let needRefresh = cred.needUpdateCredential();
    expect(needRefresh).to.be(true);
    let secret = await cred.getAccessKeySecret();
    expect(secret).to.be('temAccessKeySecret');
    let id = await cred.getAccessKeyId();
    expect(id).to.be('temAccessKeyId');

    cred.sessionCredential = null;
    expect(cred.needUpdateCredential()).to.be(true);
    let credentialModel = await cred.getCredential();
    expect(credentialModel.accessKeyId).to.be('temAccessKeyId');
    expect(credentialModel.accessKeySecret).to.be('temAccessKeySecret');
  });

  it('wrong token should get 403', async function(){
    try {
      cred.roleName = 'disableV1';
      cred.metadataTokenDuration = 654321;
      cred.sessionCredential = null;
      await cred.getCredential();
    } catch(err) {
      expect(err.message).to.be('Failed to get metadata from ECS Metadata Service. HttpCode=403');
    }
  });

  it('can use v1 to compatible', async function(){
    cred.sessionCredential = null;
    cred.roleName = 'disableV1';
    cred.metadataTokenDuration = 123456;
    let needRefresh = cred.needUpdateCredential();
    expect(needRefresh).to.be(true);
    let credential = await cred.getCredential();
    let secret = credential.accessKeySecret;
    expect(secret).to.be('AccessKeySecret');
    let id = credential.accessKeyId;
    expect(id).to.be('AccessKeyId');
  });
});

describe('EcsRamRoleCredential with disabled v1', function () {
  const cred = new EcsRamRoleCredential('roleName', {}, true, 1000);

  mock();

  it('should success', async function () {
    let credential = await cred.getCredential();
    let id = credential.accessKeyId;
    expect(id).to.be('AccessKeyId');
    let secret = credential.accessKeySecret;
    expect(secret).to.be('AccessKeySecret');
    let token = credential.securityToken;
    expect(token).to.be('SecurityToken');
    let type = credential.type;
    expect(type).to.be('ecs_ram_role');
  });

  it('should refresh credentials with sessionCredential expired', async function () {
    cred.sessionCredential.Expiration = utils.timestamp(cred.sessionCredential.Expiration, -1000 * 3600);
    let needRefresh = cred.needUpdateCredential();
    expect(needRefresh).to.be(true);
    let credential = await cred.getCredential();
    let token = credential.securityToken;
    expect(token).to.be('SecurityToken');
  });

  it('should refresh credentials with no sessionCredential', async function () {
    cred.sessionCredential = null;
    let needRefresh = cred.needUpdateCredential();
    expect(needRefresh).to.be(true);
    let credential = await cred.getCredential();
    let secret = credential.accessKeySecret;
    expect(secret).to.be('AccessKeySecret');
    let id = credential.accessKeyId;
    expect(id).to.be('AccessKeyId');
  });


  it('should throw error when v2 token get failed', async function () {
    try {
      cred.roleName = 'disableV1';
      cred.metadataTokenDuration = 123456;
      cred.sessionCredential = null;
      await cred.getCredential();
    } catch(err) {
      expect(err.message).to.be('Failed to get token from ECS Metadata Service. HttpCode=404');
    }
  });
});
