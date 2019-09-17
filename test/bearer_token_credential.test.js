'use strict';

const expect = require('expect.js');
const BearerTokenCredential = require('../lib/bearer_token_credential');

describe('BearerTokenCredential should get correct value', function () {
  it('should success', async function () {
    const cred = new BearerTokenCredential('bearerToken');
    let token = cred.getBearerToken();
    expect(token).to.be('bearerToken');
    let type = cred.getType();
    expect(type).to.be('bearer');
  });
});
describe('BearerTokenCredential with invalid config ', function () {
  it('should failed when config has no bearerToken', async function () {
    expect(function () {
      new BearerTokenCredential();
    }).throwException(/Missing required bearerToken option in config for bearer/);
  });
});

