'use strict';

const expect = require('expect.js');
const Credentials = require('../lib/credentials');

describe('AccessKeyCredential with valid config', function () {
  it('should success get corret value', async function () {
    const cred = new Credentials({
      type: 'access_key',
      access_key_id: 'access_key_id',
      access_key_secret: 'access_key_secret',
    });
    let id = await cred.getAccessKeyId();
    expect(id).to.be('access_key_id');
    let secret = await cred.getAccessKeySecret();
    expect(secret).to.be('access_key_secret');
    let type = await cred.getType();
    expect(type).to.be('access_key');
  });
});
describe('AccessKeyCredential with invalid config', function () {
  it('should faild when config has no access_key_id', async function () {
    let error = '';
    try {
      const cred = new Credentials({
        type: 'access_key',
        access_key_secret: 'access_key_secret',
      });
      await cred.getAccessKeyId();
    } catch (e) {
      error = e.message;
    }
    expect(error).to.be('Missing required access_key_id option in config for access_key');
  });
  it('should faild when config has no access_key_secret', async function () {
    let error = '';
    try {
      const cred = new Credentials({
        type: 'access_key',
        access_key_id: 'access_key_id'
      });
      await cred.getAccessKeyId();
    } catch (e) {
      error = e.message;
    }
    expect(error).to.be('Missing required access_key_secret option in config for access_key');
  });
});

