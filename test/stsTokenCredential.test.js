'use strict';

const expect = require('expect.js');
const Credentials = require('../lib/credentials');

describe('StsTokenCredential should get correct value ', function () {
  it('should success', async function () {
    const cred = new Credentials({
      type: 'sts',
      access_key_id: 'access_key_id',
      access_key_secret: 'access_key_secret',
      security_token: 'security_token'
    });
    let id = await cred.getAccessKeyId();
    expect(id).to.be('access_key_id');
    let secret = await cred.getAccessKeySecret();
    expect(secret).to.be('access_key_secret');
    let token = await cred.getSecurityToken();
    expect(token).to.be('security_token');
    let type = await cred.getType();
    expect(type).to.be('sts');
  });
});
describe('StsTokenCredential should filed with invalid config ', function () {
  it('should faild when config has no access_key_id', async function () {
    let error = '';
    try {
      const cred = new Credentials({
        type: 'sts',
        access_key_secret: 'access_key_secret',
        security_token: 'security_token'
      });
      await cred.getAccessKeyId();
    } catch (e) {
      error = e.message;
    }
    expect(error).to.be('Missing required access_key_id option in config for sts');
  });
  it('should faild when config has no access_key_secret', async function () {
    let error = '';
    try {
      const cred = new Credentials({
        type: 'sts',
        access_key_id: 'access_key_id',
        security_token: 'security_token'
      });
      await cred.getAccessKeyId();
    } catch (e) {
      error = e.message;
    }
    expect(error).to.be('Missing required access_key_secret option in config for sts');
  });
  it('should faild when config has no security_token', async function () {
    let error = '';
    try {
      const cred = new Credentials({
        type: 'sts',
        access_key_id: 'access_key_id',
        access_key_secret: 'access_key_secret'
      });
      await cred.getSecurityToken();
    } catch (e) {
      error = e.message;
    }
    expect(error).to.be('Missing required security_token option in config for sts');
  });
});

