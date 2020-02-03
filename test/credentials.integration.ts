import expect from 'expect.js';
import RamRoleArnCredential from '../src/ram_role_arn_credential';
import 'mocha';

const defaultConfig = {
  type: 'ram_role_arn',
  roleArn: process.env.ROLE_ARN,
  accessKeyId: process.env.SUB_ACCESS_KEY_ID,
  accessKeySecret: process.env.SUB_ACCESS_KEY_SECRET
};

describe('RamRoleArnCredential with correct config', function () {
  const cred = new RamRoleArnCredential(defaultConfig);
  it('should success', async function () {
    let id = await cred.getAccessKeyId();
    expect(id).to.be.a('string');
    let secret = await cred.getAccessKeySecret();
    expect(secret).to.be.a('string');
    let token = await cred.getSecurityToken();
    expect(token).to.be.a('string');
    let type = cred.getType();
    expect(type).to.be('ram_role_arn');
    // repeat
    let repeatId = await cred.getAccessKeyId();
    expect(repeatId).to.be(id);
    let repeatSecret = await cred.getAccessKeySecret();
    expect(repeatSecret).to.be(secret);
    let repeatToken = await cred.getSecurityToken();
    expect(repeatToken).to.be(token);
  });
});
