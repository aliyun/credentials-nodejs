'use strict';

const expect = require('expect.js');
const Credentials = require('../lib/credentials');
const DefaultCredential = require('../lib/default_credential');
const DefaultProvider = require('../lib/provider/provider_chain');
const mm = require('mm');
const fs = require('fs');
const utils = require('../lib/util/utils');


describe('Credentials with no config', function () {
  before(function () {
    mm(DefaultProvider, 'getCredentials', function () {
      return new DefaultCredential({ type: 'default' });
    });
  });
  after(function () {
    mm.restore();
  });
  it('it should return default providerChain credentials', async function () {
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
  it('it should return AssessKeyCredential when type is access_key', async function () {
    let cred = new Credentials({
      type: 'access_key',
      access_key_id: 'access_key_id',
      access_key_secret: 'access_key_secret'
    });
    let type = cred.getType();
    expect(type).to.be('access_key');
  });
  it('it should return BearerTokenCredential when type is bearer', async function () {
    let cred = new Credentials({
      type: 'bearer',
      bearer_token: 'bearer_token'
    });
    let type = cred.getType();
    expect(type).to.be('bearer');
  });
  it('it should return StsTokenCredential when type is sts', async function () {
    let cred = new Credentials({
      type: 'sts',
      access_key_id: 'access_key_id',
      access_key_secret: 'access_key_secret',
      security_token: 'security_token'
    });
    let type = cred.getType();
    expect(type).to.be('sts');
  });
  it('it should return EcsRamRoleCredential when type is ecs_ram_role', async function () {
    let cred = new Credentials({
      type: 'ecs_ram_role',
      role_name: 'role_name'
    });
    let type = cred.getType();
    expect(type).to.be('ecs_ram_role');
  });
  it('it should return RamRoleArnCredential when type is ram_role_arn', async function () {
    let cred = new Credentials({
      type: 'ram_role_arn',
      access_key_id: 'access_key_id',
      access_key_secret: 'access_key_secret',
      role_arn: 'role_arn'
    });
    let type = cred.getType();
    expect(type).to.be('ram_role_arn');
  });
  it('it should return RsaKeyPairCredential when type is rsa_key_pair', async function () {
    let cred = new Credentials({
      type: 'rsa_key_pair',
      public_key_id: 'public_key_id',
      private_key_file: 'private_key_file'
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


