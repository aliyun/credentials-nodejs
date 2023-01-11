import expect from 'expect.js';
import RamRoleArnCredential from '../src/ram_role_arn_credential';
import OidcRoleArnCredential from '../src/oidc_role_arn_credential';
import Config from '../src/config';
import 'mocha';
import path from 'path';

const defaultConfig = new Config({
  type: 'ram_role_arn',
  roleArn: process.env.ROLE_ARN,
  accessKeyId: process.env.SUB_ACCESS_KEY_ID,
  accessKeySecret: process.env.SUB_ACCESS_KEY_SECRET
});

const oidcConfig: Config = new Config({
  type: 'oidc_role_arn',
  roleArn: 'acs:ram::roleArn:role/roleArn',
  oidcProviderArn: 'acs:ram::roleArn',
  oidcTokenFilePath: path.join(__dirname, '/fixtures/OIDCToken.txt')
});

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

describe('OidcRoleArnCredential with correct config', function () {
  const cred = new OidcRoleArnCredential(oidcConfig);
  it('should success', async function () {
    try {
      await cred.updateCredential();
    } catch (error) {
      expect(error.code).to.be('AuthenticationFail.OIDCToken.Invalid');
    }
  });
});
