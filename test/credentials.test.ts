

import expect from 'expect.js';
import Credentials from '../src/client';
import DefaultCredential from '../src/default_credential';
import * as DefaultProvider from '../src/provider/provider_chain';
import mm from 'mm';
import * as utils from '../src/util/utils';
import Config from '../src/config';
import 'mocha';
import fs from 'fs';
import assert from 'assert'

describe('Credentials with no config', function () {
  before(function () {
    mm(DefaultProvider, 'getCredentials', function () {
      const conf = new Config({ type: 'default' });
      return new DefaultCredential(conf);
    });
  });

  after(function () {
    mm.restore();
  });

  it('should return default providerChain credentials', async function () {
    let cred = new Credentials();
    let type = cred.getType();
    expect(type).to.be('default');
  });
});

describe('Credentials with valid config', function () {
  before(function () {
    mm(fs, 'existsSync', function () {
      return true;
    });

    mm(utils, 'parseFile', function () {
      return true;
    });
  });

  it('should return AssessKeyCredential when type is access_key', async function () {
    const conf = new Config({
      type: 'access_key',
      accessKeyId: 'accessKeyId',
      accessKeySecret: 'accessKeySecret'
    });
    let cred = new Credentials(conf);
    expect(cred.getType()).to.be('access_key');
    expect(await cred.getAccessKeyId()).to.be('accessKeyId');
    expect(await cred.getAccessKeySecret()).to.be('accessKeySecret');
    expect(await cred.getSecurityToken()).to.be('');
    expect(cred.getBearerToken()).to.be('');
  });

  it('should return BearerTokenCredential when type is bearer', async function () {
    const conf = new Config({
      type: 'bearer',
      bearerToken: 'bearerToken'
    });
    let cred = new Credentials(conf);
    expect(cred.getType()).to.be('bearer');
    expect(await cred.getAccessKeyId()).to.be('');
    expect(await cred.getAccessKeySecret()).to.be('');
    expect(await cred.getSecurityToken()).to.be('');
    expect(cred.getBearerToken()).to.be('bearerToken');
  });

  it('should return StsTokenCredential when type is sts', async function () {
    const conf = new Config({
      type: 'sts',
      accessKeyId: 'accessKeyId',
      accessKeySecret: 'accessKeySecret',
      securityToken: 'securityToken'
    });
    let cred = new Credentials(conf);
    expect(cred.getType()).to.be('sts');
    expect(await cred.getAccessKeyId()).to.be('accessKeyId');
    expect(await cred.getAccessKeySecret()).to.be('accessKeySecret');
    expect(await cred.getSecurityToken()).to.be('securityToken');
    expect(cred.getBearerToken()).to.be('');
  });

  it('should return EcsRamRoleCredential when type is ecs_ram_role', async function () {
    const conf = new Config({
      type: 'ecs_ram_role',
      roleName: 'roleName'
    });
    let cred = new Credentials(conf);
    let type = cred.getType();
    expect(type).to.be('ecs_ram_role');
  });

  it('should return RamRoleArnCredential when type is ram_role_arn', async function () {
    const conf = new Config({
      type: 'ram_role_arn',
      accessKeyId: 'accessKeyId',
      accessKeySecret: 'accessKeySecret',
      roleArn: 'roleArn'
    });
    let cred = new Credentials(conf);
    let type = cred.getType();
    expect(type).to.be('ram_role_arn');
  });

  it('should return RsaKeyPairCredential when type is rsa_key_pair', async function () {
    const conf = new Config({
      type: 'rsa_key_pair',
      publicKeyId: 'publicKeyId',
      privateKeyFile: 'privateKeyFile'
    });
    let cred = new Credentials(conf);
    let type = cred.getType();
    expect(type).to.be('rsa_key_pair');
  });

  it('should return URICredential when type is credentials_uri', async function () {
    const conf = new Config({
      type: 'credentials_uri',
      credentialsURI: 'http://a_local_or_remote_address/'
    });
    let cred = new Credentials(conf);
    let type = cred.getType();
    expect(type).to.be('credentials_uri');
  });
});

describe('Credentials with invalid config ', function () {
  it('should failed when config has no type', async function () {
    expect(function () {
      const conf = new Config({});
      new Credentials(conf);
    }).throwException(/Missing required type option/);
  });

  it('should failed when config has invalid type', async function () {
    expect(function () {
      const conf = new Config({
        type: 'invalid_type'
      });
      new Credentials(conf);
    }).throwException(/Invalid type option, support: access_key, sts, ecs_ram_role, ram_role_arn, rsa_key_pair, credentials_uri/);
  });
});

describe('Credentials', function () {
  it('should ok', async function () {
    const conf = new Config({
      type: 'access_key',
      accessKeyId: 'akid',
      accessKeySecret: 'aksecret'
    });
    const cred = new Credentials(conf);
    assert.strictEqual(await cred.getAccessKeyId(), 'akid');
    assert.strictEqual(await cred.getAccessKeySecret(), 'aksecret');
    assert.strictEqual(await cred.getSecurityToken(), '');
    assert.strictEqual(cred.getBearerToken(), '');
  });
});
