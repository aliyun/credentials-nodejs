import expect from 'expect.js';
import 'mocha';

import AccessKeyCredential from '../src/access_key_credential';

describe('AccessKeyCredential with valid config', function () {
  it('should success get correct value', async function () {
    const cred = new AccessKeyCredential('accessKeyId', 'accessKeySecret');
    let id = await cred.getAccessKeyId();
    expect(id).to.be('accessKeyId');
    let secret = await cred.getAccessKeySecret();
    expect(secret).to.be('accessKeySecret');
    let type = await cred.getType();
    expect(type).to.be('access_key');
  });
});

describe('AccessKeyCredential with invalid config', function () {
  it('should failed when config has no accessKeyId', async function () {
    expect(function () {
      new AccessKeyCredential(undefined, 'accessKeySecret');
    }).throwException(/Missing required accessKeyId option in config for access_key/);
  });
  it('should failed when config has no accessKeySecret', async function () {
    expect(function () {
      new AccessKeyCredential('accessKeyId', undefined);
    }).throwException(/Missing required accessKeySecret option in config for access_key/);
  });
});
