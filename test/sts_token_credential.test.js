'use strict';

const expect = require('expect.js');
const StsTokenCredential = require('../lib/sts_token_credential');

describe('StsTokenCredential should get correct value ', function () {
  it('should success', async function () {
    const cred = new StsTokenCredential('access_key_id', 'access_key_secret', 'security_token');
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
  it('should failed when config has no access_key_id', async function () {
    expect(function () {
      new StsTokenCredential(undefined, 'access_key_secret', 'security_token');
    }).throwException(/Missing required access_key_id option in config for sts/);
  });
  it('should failed when config has no access_key_secret', async function () {
    expect(function () {
      new StsTokenCredential('access_key_id', undefined, 'security_token');
    }).throwException(/Missing required access_key_secret option in config for sts/);
  });
  it('should failed when config has no security_token', async function () {
    expect(function () {
      new StsTokenCredential('access_key_id', 'access_key_secret', undefined);
    }).throwException(/Missing required security_token option in config for sts/);
  });
});

