'use strict';

const expect = require('expect.js');
const Credentials = require('../lib/credentials');

describe('BearerTokenCredential should get correct value', function () {
  it('should success', async function () {
    const cred = new Credentials({
      type: 'bearer',
      bearer_token: 'bearer_token',
    });
    let token = cred.getBearerToken();
    expect(token).to.be('bearer_token');
    let type = cred.getType();
    expect(type).to.be('bearer');
  });
});
describe('BearerTokenCredential with invalid config ', function () {
  it('should faild when config has no bearer_token', async function () {
    let error = '';
    try {
      const cred = new Credentials({
        type: 'bearer',
      });
      await cred.getAccessKeyId();
    } catch (e) {
      error = e.message;
    }
    expect(error).to.be('Missing required bearer_token option in config for bearer');
  });
});

