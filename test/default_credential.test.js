'use strict';

const expect = require('expect.js');
const DefaultCredential = require('../lib/default_credential');

describe('DefaultCredential get correct value', function () {
  it('should success', async function () {
    const cred = new DefaultCredential();
    let id = await cred.getAccessKeyId();
    expect(id).to.be('');
    let secret = await cred.getAccessKeySecret();
    expect(secret).to.be('');
    let securityToken = await cred.getSecurityToken();
    expect(securityToken).to.be('');
  });
});

