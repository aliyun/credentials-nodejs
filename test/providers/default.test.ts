import assert from 'assert';
import DefaultCredentialsProvider from '../../src/providers/default';
import EnvironmentVariableCredentialsProvider from '../../src/providers/env';
import CLIProfileCredentialsProvider from '../../src/providers/cli_profile';
import ProfileCredentialsProvider from '../../src/providers/profile';
import ECSRAMRoleCredentialsProvider from '../../src/providers/ecs_ram_role';
import OIDCRoleArnCredentialsProvider from '../../src/providers/oidc_role_arn';
import Credentials from '../../src/credentials';

describe('DefaultCredentialsProvider', function () {

  it('DefaultCredentialsProvider', async function () {
    let provider = DefaultCredentialsProvider.builder().build();

    assert.ok((provider as any).providers.length === 3);
    assert.ok((provider as any).providers[0] instanceof EnvironmentVariableCredentialsProvider);
    assert.ok((provider as any).providers[1] instanceof CLIProfileCredentialsProvider);
    assert.ok((provider as any).providers[2] instanceof ProfileCredentialsProvider);

    // Add oidc provider
    process.env.ALIBABA_CLOUD_OIDC_TOKEN_FILE = '/path/to/oidc.token';
    process.env.ALIBABA_CLOUD_OIDC_PROVIDER_ARN = 'oidcproviderarn';
    process.env.ALIBABA_CLOUD_ROLE_ARN = 'rolearn';

    provider = DefaultCredentialsProvider.builder().build();

    assert.ok((provider as any).providers.length === 4);
    assert.ok((provider as any).providers[0] instanceof EnvironmentVariableCredentialsProvider)
    assert.ok((provider as any).providers[1] instanceof OIDCRoleArnCredentialsProvider)
    assert.ok((provider as any).providers[2] instanceof CLIProfileCredentialsProvider)
    assert.ok((provider as any).providers[3] instanceof ProfileCredentialsProvider)

    // Add ecs ram role
    process.env.ALIBABA_CLOUD_ECS_METADATA = 'rolename';
    provider = DefaultCredentialsProvider.builder().build();

    assert.ok((provider as any).providers.length === 5);
    assert.ok((provider as any).providers[0] instanceof EnvironmentVariableCredentialsProvider);
    assert.ok((provider as any).providers[1] instanceof OIDCRoleArnCredentialsProvider);
    assert.ok((provider as any).providers[2] instanceof CLIProfileCredentialsProvider);
    assert.ok((provider as any).providers[3] instanceof ProfileCredentialsProvider)
    assert.ok((provider as any).providers[4] instanceof ECSRAMRoleCredentialsProvider);

    delete process.env.ALIBABA_CLOUD_OIDC_TOKEN_FILE;
    delete process.env.ALIBABA_CLOUD_OIDC_PROVIDER_ARN;
    delete process.env.ALIBABA_CLOUD_ROLE_ARN;
    delete process.env.ALIBABA_CLOUD_ECS_METADATA;
  });

  it('getCredentials', async function () {
    process.env.ALIBABA_CLOUD_CLI_PROFILE_DISABLED = 'true';

    let provider = DefaultCredentialsProvider.builder().build();
    assert.ok((provider as any).providers.length === 2);
    try {
      await provider.getCredentials();
      assert.fail();
    } catch (ex) {
      assert.ok(ex.message.startsWith('unable to get credentials from any of the providers in the chain: unable to get credentials from enviroment variables, Access key ID must be specified via environment variable (ALIBABA_CLOUD_ACCESS_KEY_ID)'));
    }

    process.env.ALIBABA_CLOUD_ACCESS_KEY_ID = 'akid';
    process.env.ALIBABA_CLOUD_ACCESS_KEY_SECRET = 'aksecret';
    provider = DefaultCredentialsProvider.builder().build();
    assert.ok((provider as any).providers.length === 2);
    let cc = await provider.getCredentials();
    assert.deepStrictEqual(cc, Credentials.builder()
      .withAccessKeyId('akid')
      .withAccessKeySecret('aksecret')
      .withProviderName('default/env')
      .build());
    // get again
    cc = await provider.getCredentials();
    assert.deepStrictEqual(cc, Credentials.builder()
      .withAccessKeyId('akid')
      .withAccessKeySecret('aksecret')
      .withProviderName('default/env')
      .build());
    delete process.env.ALIBABA_CLOUD_ACCESS_KEY_ID;
    delete process.env.ALIBABA_CLOUD_ACCESS_KEY_SECRET;
    delete process.env.ALIBABA_CLOUD_SECURITY_TOKEN;
    delete process.env.ALIBABA_CLOUD_CLI_PROFILE_DISABLED;
  });

});
