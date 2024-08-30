import assert from 'assert';
import 'mocha';
import CredentialsClient, { Config } from '../src/client';

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
    const credentials = await client.getCredential();
    assert.ok(credentials);
    assert.strictEqual(credentials.type, 'ram_role_arn');
    assert.ok(credentials.securityToken);
  });

  it('RAM Role ARN should ok with sts', async function () {
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
    const credentials = await client.getCredential();
    assert.ok(credentials);
    assert.strictEqual(credentials.type, 'oidc_role_arn');
    assert.ok(credentials.securityToken);
  });
});
