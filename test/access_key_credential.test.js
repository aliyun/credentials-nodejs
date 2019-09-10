'use strict';

const expect = require('expect.js');
const AccessKeyCredential = require('../lib/access_key_credential');

describe('AccessKeyCredential with valid config', function () {
  it('should success get correct value', async function () {
    const cred = new AccessKeyCredential('access_key_id', 'access_key_secret');
    let id = await cred.getAccessKeyId();
    expect(id).to.be('access_key_id');
    let secret = await cred.getAccessKeySecret();
    expect(secret).to.be('access_key_secret');
    let type = await cred.getType();
    expect(type).to.be('access_key');
  });
});
describe('AccessKeyCredential with invalid config', function () {
  it('should failed when config has no access_key_id', async function () {
    expect(function () {
      new AccessKeyCredential(undefined, 'access_key_secret');
    }).throwException(/Missing required access_key_id option in config for access_key/);
  });
  it('should failed when config has no access_key_secret', async function () {
    expect(function () {
      new AccessKeyCredential('access_key_id', undefined);
    }).throwException(/Missing required access_key_secret option in config for access_key/);
  });
});

