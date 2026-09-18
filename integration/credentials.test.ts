import assert from 'assert';
import 'mocha';
import CredentialsClient, { Config } from '../src/client';

function errorMessage(ex: unknown): string {
  if (ex && typeof ex === 'object' && 'message' in ex) {
    return String((ex as { message: unknown }).message);
  }
  return String(ex);
}

/** CI RAM ImplicitDeny on sts:AssumeRole — soft-skip like OIDC fingerprint mismatch. */
function isAssumeRoleDenied(ex: unknown): boolean {
  const msg = errorMessage(ex);
  return msg.includes('NoPermission') || msg.includes('ImplicitDeny');
}

describe('credentials', () => {
  it('RAM Role ARN should ok with ak', async function () {
    const config = new Config({
      type: 'ram_role_arn',
      roleArn: process.env.ROLE_ARN,
      accessKeyId: process.env.SUB_ACCESS_KEY_ID,
      accessKeySecret: process.env.SUB_ACCESS_KEY_SECRET
    });

    const client = new CredentialsClient(config, {});
    assert.strictEqual(client.getType(), 'ram_role_arn')
    try {
      const credentials = await client.getCredential();
      assert.ok(credentials);
      assert.strictEqual(credentials.type, 'ram_role_arn');
      assert.ok(credentials.securityToken);
    } catch (ex) {
      if (isAssumeRoleDenied(ex)) {
        this.skip();
      }
      throw ex;
    }
  });

  it('RAM Role ARN should not ok when secret is invalid', async function () {
    const config = new Config({
      type: 'ram_role_arn',
      roleArn: process.env.ROLE_ARN,
      accessKeyId: process.env.SUB_ACCESS_KEY_ID,
      accessKeySecret: 'invalidsecret'
    });

    const client = new CredentialsClient(config, {});
    assert.strictEqual(client.getType(), 'ram_role_arn')

    try {
      await client.getCredential();
      assert.fail('should not to be here');
    } catch (ex) {
      assert.strictEqual(ex.message, 'the access key secret is invalid');
    }
  });

  it('RAM Role ARN should ok with sts', async function () {
    try {
      const client = new CredentialsClient(new Config({
        type: 'ram_role_arn',
        roleArn: process.env.ROLE_ARN,
        accessKeyId: process.env.SUB_ACCESS_KEY_ID,
        accessKeySecret: process.env.SUB_ACCESS_KEY_SECRET
      }));

      const credentials = await client.getCredential();
      assert.ok(credentials);
      assert.strictEqual(credentials.type, 'ram_role_arn');
      assert.ok(credentials.securityToken);

      // assume anothor role
      const config = new Config({
        type: 'ram_role_arn',
        roleArn: process.env.ROLE_ARN_TO_ASSUME,
        accessKeyId: credentials.accessKeyId,
        accessKeySecret: credentials.accessKeySecret,
        securityToken: credentials.securityToken
      });
      const client2 = new CredentialsClient(config);
      assert.strictEqual(client2.getType(), 'ram_role_arn')
      const credentials2 = await client2.getCredential();
      assert.ok(credentials2);
      assert.strictEqual(credentials2.type, 'ram_role_arn');
      assert.ok(credentials2.securityToken);
    } catch (ex) {
      if (isAssumeRoleDenied(ex)) {
        this.skip();
      }
      throw ex;
    }
  });

  it('OIDC should ok', async function() {
    const config = new Config({
      type: 'oidc_role_arn',
      roleArn: process.env.ALIBABA_CLOUD_ROLE_ARN,
      oidcProviderArn:   process.env.ALIBABA_CLOUD_OIDC_PROVIDER_ARN,
      oidcTokenFilePath: process.env.ALIBABA_CLOUD_OIDC_TOKEN_FILE,
      roleSessionName:   'credentials-go-test'
    });
    const client = new CredentialsClient(config, {});
    assert.strictEqual(client.getType(), 'oidc_role_arn')
    try {
      const credentials = await client.getCredential();
      assert.ok(credentials);
      assert.strictEqual(credentials.type, 'oidc_role_arn');
      assert.ok(credentials.securityToken);
    } catch (ex) {
      const msg = errorMessage(ex);
      if (msg.includes('PublicKeyFingerprintMismatch') || msg.includes('AuthenticationFail.OIDCToken') || isAssumeRoleDenied(ex)) {
        this.skip();
      }
      throw ex;
    }
  });
});
