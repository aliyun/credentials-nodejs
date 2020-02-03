

import expect from 'expect.js';
import StsTokenCredential from '../src/sts_token_credential';
import 'mocha';

describe('StsTokenCredential should get correct value ', function () {
  it('should success', async function () {
    const cred = new StsTokenCredential('accessKeyId', 'accessKeySecret', 'securityToken');
    let id = await cred.getAccessKeyId();
    expect(id).to.be('accessKeyId');
    let secret = await cred.getAccessKeySecret();
    expect(secret).to.be('accessKeySecret');
    let token = await cred.getSecurityToken();
    expect(token).to.be('securityToken');
    let type = await cred.getType();
    expect(type).to.be('sts');
  });
});
describe('StsTokenCredential should filed with invalid config ', function () {
  it('should failed when config has no accessKeyId', async function () {
    expect(function () {
      new StsTokenCredential(undefined, 'accessKeySecret', 'securityToken');
    }).throwException(/Missing required accessKeyId option in config for sts/);
  });
  it('should failed when config has no accessKeySecret', async function () {
    expect(function () {
      new StsTokenCredential('accessKeyId', undefined, 'securityToken');
    }).throwException(/Missing required accessKeySecret option in config for sts/);
  });
  it('should failed when config has no securityToken', async function () {
    expect(function () {
      new StsTokenCredential('accessKeyId', 'accessKeySecret', undefined);
    }).throwException(/Missing required securityToken option in config for sts/);
  });
});

