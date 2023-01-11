

import expect from 'expect.js';
import oidcRoleArnCredentialsProvider from '../src/provider/oidc_role_arn_credentials_provider';
import mm from 'mm';
import 'mocha';
import path from 'path';

describe('oidcRoleArnCredentialsProvider with env variables', function () {
  before(function () {
    mm(process.env, 'ALIBABA_CLOUD_ROLE_ARN', 'accessKeyId');
    mm(process.env, 'ALIBABA_CLOUD_OIDC_PROVIDER_ARN', 'accessKeySecret');
    mm(process.env, 'ALIBABA_CLOUD_OIDC_TOKEN_FILE', path.join(__dirname, '/fixtures/OIDCToken.txt'));
  });

  after(function () {
    mm.restore();
  });

  it('should success', async function () {
    try {
      await oidcRoleArnCredentialsProvider.getCredential();
    } catch (error) {
      expect(error.code).to.be('AuthenticationFail.OIDCToken.Invalid');
    }
  });
});

describe('oidcRoleArnCredentialsProvider with no env variables ', function () {
  before(function () {
    delete process.env.ALIBABA_CLOUD_ROLE_ARN;
    delete process.env.ALIBABA_CLOUD_OIDC_PROVIDER_ARN;
    delete process.env.ALIBABA_CLOUD_OIDC_TOKEN_FILE;
  });

  after(function () {
    mm.restore();
  });

  it('should return null', async function () {
    const cred = oidcRoleArnCredentialsProvider.getCredential();
    expect(cred).to.be(null);
  });
});