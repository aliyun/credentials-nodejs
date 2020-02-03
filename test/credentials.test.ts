

import expect from 'expect.js';
import Credentials from '../src/client';
import DefaultCredential from '../src/default_credential';
import * as DefaultProvider from '../src/provider/provider_chain';
import mm from 'mm';
import * as utils from '../src/util/utils';
import 'mocha';
import fs from 'fs';

describe('Credentials with no config', function () {
  before(function () {
    mm(DefaultProvider, 'getCredentials', function () {
      return new DefaultCredential({ type: 'default' });
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
    let cred = new Credentials({
      type: 'access_key',
      accessKeyId: 'accessKeyId',
      accessKeySecret: 'accessKeySecret'
    });
    let type = cred.getType();
    expect(type).to.be('access_key');
  });

  it('should return BearerTokenCredential when type is bearer', async function () {
    let cred = new Credentials({
      type: 'bearer',
      bearerToken: 'bearerToken'
    });
    let type = cred.getType();
    expect(type).to.be('bearer');
  });

  it('should return StsTokenCredential when type is sts', async function () {
    let cred = new Credentials({
      type: 'sts',
      accessKeyId: 'accessKeyId',
      accessKeySecret: 'accessKeySecret',
      securityToken: 'securityToken'
    });
    let type = cred.getType();
    expect(type).to.be('sts');
  });

  it('should return EcsRamRoleCredential when type is ecs_ram_role', async function () {
    let cred = new Credentials({
      type: 'ecs_ram_role',
      roleName: 'roleName'
    });
    let type = cred.getType();
    expect(type).to.be('ecs_ram_role');
  });

  it('should return RamRoleArnCredential when type is ram_role_arn', async function () {
    let cred = new Credentials({
      type: 'ram_role_arn',
      accessKeyId: 'accessKeyId',
      accessKeySecret: 'accessKeySecret',
      roleArn: 'roleArn'
    });
    let type = cred.getType();
    expect(type).to.be('ram_role_arn');
  });

  it('should return RsaKeyPairCredential when type is rsa_key_pair', async function () {
    let cred = new Credentials({
      type: 'rsa_key_pair',
      publicKeyId: 'publicKeyId',
      privateKeyFile: 'privateKeyFile'
    });
    let type = cred.getType();
    expect(type).to.be('rsa_key_pair');
  });
});

describe('Credentials with invalid config ', function () {
  it('should failed when config has no type', async function () {
    expect(function () {
      new Credentials({});
    }).throwException(/Missing required type option/);
  });

  it('should failed when config has invalid type', async function () {
    expect(function () {
      new Credentials({
        type: 'invalid_type'
      });
    }).throwException(/Invalid type option, support: access_key, sts, ecs_ram_role, ram_role_arn, rsa_key_pair/);
  });
});


