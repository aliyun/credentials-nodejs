

import expect from 'expect.js';
import RsaKeyPairCredential from '../src/rsa_key_pair_credential';
import mm from 'mm';
import fs from 'fs';
import * as utils from '../src/util/utils';
import * as httpUtil from '../src/util/http';
import 'mocha';

describe('RsaKeyPairCredential with correct config', function () {
  before(function () {
    mm(fs, 'existsSync', function () {
      return true;
    });
    mm(utils, 'parseFile', function () {
      return true;
    });
    mm(httpUtil, 'request', function () {
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
    const cred = new RsaKeyPairCredential('publicKeyId', 'privateKeyFile');
    let id = await cred.getAccessKeyId();
    expect(id).to.be('AccessKeyId');
    let secret = await cred.getAccessKeySecret();
    expect(secret).to.be('AccessKeySecret');
    let token = await cred.getSecurityToken();
    expect(token).to.be('SecurityToken');
    let type = cred.getType();
    expect(type).to.be('rsa_key_pair');

    let credentialModel = await cred.getCredential();
    expect(credentialModel.accessKeyId).to.be('AccessKeyId');
    expect(credentialModel.accessKeySecret).to.be('AccessKeySecret');
    expect(credentialModel.securityToken).to.be('SecurityToken');
    expect(credentialModel.type).to.be('rsa_key_pair');
  });
  it('should refresh credentials with sessionCredential expired', async function () {
    const cred = new RsaKeyPairCredential('publicKeyId', 'privateKeyFile');
    let id = await cred.getAccessKeyId();
    expect(id).to.be('AccessKeyId');
    cred.sessionCredential.Expiration = utils.timestamp(cred.sessionCredential.Expiration, -1100 * 3600);
    let needRefresh = cred.needUpdateCredential();
    expect(needRefresh).to.be(true);
    let token = await cred.getSecurityToken();
    expect(token).to.be('SecurityToken');

    cred.sessionCredential.Expiration = utils.timestamp(cred.sessionCredential.Expiration, -1100 * 3600);
    expect(cred.needUpdateCredential()).to.be(true);
    let credentialModel = await cred.getCredential();
    expect(credentialModel.accessKeyId).to.be('AccessKeyId');
    expect(credentialModel.securityToken).to.be('SecurityToken');
  });
  it('should refresh credentials with no sessionCredential', async function () {
    const cred = new RsaKeyPairCredential('publicKeyId', 'privateKeyFile');
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
    expect(credentialModel.accessKeySecret).to.be('AccessKeySecret');
  });
});
describe('RsaKeyPairCredential should filed with invalid config ', function () {
  before(function () {
    mm(fs, 'existsSync', function () {
      return true;
    });
  });
  after(function () {
    mm.restore();
  });
  it('should failed when config has no publicKeyId', async function () {
    expect(function () {
      new RsaKeyPairCredential(undefined, 'privateKeyFile');
    }).throwException(/Missing required publicKeyId option in config for rsa_key_pair/);
  });
  it('should failed when config has no privateKeyFile', async function () {
    expect(function () {
      new RsaKeyPairCredential('publicKeyId', undefined);
    }).throwException(/Missing required privateKeyFile option in config for rsa_key_pair/);
  });
});
describe('RsaKeyPairCredential should filed with privateKeyFile not exists', function () {
  it('should failed', async function () {
    expect(function () {
      new RsaKeyPairCredential('publicKeyId', 'privateKeyFile');
    }).throwException(/privateKeyFile privateKeyFile cannot be empty/);
  });
});


