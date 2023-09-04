import expect from 'expect.js';
import BearerTokenCredential from '../src/bearer_token_credential';
import 'mocha';

describe('BearerTokenCredential should get correct value', function () {
  it('should success', async function () {
    const cred = new BearerTokenCredential('bearerToken');
    let token = cred.getBearerToken();
    expect(token).to.be('bearerToken');
    let type = cred.getType();
    expect(type).to.be('bearer');

    let credentialModel = await cred.getCredential();
    expect(credentialModel.bearerToken).to.be('bearerToken');
    expect(credentialModel.type).to.be('bearer');
  });
});

describe('BearerTokenCredential with invalid config ', function () {
  it('should failed when config has no bearerToken', async function () {
    expect(function () {
      new BearerTokenCredential(undefined);
    }).throwException(/Missing required bearerToken option in config for bearer/);
  });
});
