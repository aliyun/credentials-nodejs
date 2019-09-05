'use strict';

const expect = require('expect.js');
const DefaultCredential = require('../lib/defaultCredential');

describe('DefaultCredential get corret value', function () {
  it('should success', async function () {
    const cred = new DefaultCredential();
    let id = cred.getAccessKeyId();
    expect(id).to.be('');
    let secret = cred.getAccessKeySecret();
    expect(secret).to.be('');
    let bearerToken = cred.getBearerToken();
    expect(bearerToken).to.be('');
    let securityToken = cred.getSecurityToken();
    expect(securityToken).to.be('');
  });
});

