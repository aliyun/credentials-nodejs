

import expect from 'expect.js';
import DefaultCredential from '../src/default_credential';
import Config from '../src/config';
import 'mocha';

describe('DefaultCredential get correct value', function () {
  it('should success', async function () {
    const conf = new Config({});
    const cred = new DefaultCredential(conf);
    let id = await cred.getAccessKeyId();
    expect(id).to.be('');
    let secret = await cred.getAccessKeySecret();
    expect(secret).to.be('');
    let securityToken = await cred.getSecurityToken();
    expect(securityToken).to.be('');
    let bearerToken = cred.getBearerToken();
    expect(bearerToken).to.be('');
  });
});

