import assert from 'assert';
import path from 'path';

import CLIProfileCredentialsProvider, { getConfiguration, getProfile } from '../../src/providers/cli_profile';
import CredentialsProvider from '../../src/credentials_provider';
import ECSRAMRoleCredentialsProvider from '../../src/providers/ecs_ram_role';
import RAMRoleARNCredentialsProvider from '../../src/providers/ram_role_arn';
import OIDCRoleArnCredentialsProvider from '../../src/providers/oidc_role_arn';
import Credentials from '../../src/credentials';

describe('CLIProfileCredentialsProvider', function () {
  it('construct should ok', async function () {
    let b = CLIProfileCredentialsProvider.builder().build();
    assert.ok(!(b as any).profileName)

    // get from env
    process.env.ALIBABA_CLOUD_PROFILE = 'custom_profile';

    b = CLIProfileCredentialsProvider.builder().build();
    assert.strictEqual((b as any).profileName, 'custom_profile');

    b = CLIProfileCredentialsProvider.builder()
      .withProfileName('profilename')
      .build();
    assert.strictEqual((b as any).profileName, 'profilename');

    delete process.env.ALIBABA_CLOUD_PROFILE;
  });

  it('ALIBABA_CLOUD_CLI_PROFILE_DISABLED should ok', async function () {
    process.env.ALIBABA_CLOUD_CLI_PROFILE_DISABLED = 'true';
    try {
      CLIProfileCredentialsProvider.builder().build();
      assert.fail();
    } catch (ex) {
      assert.strictEqual(ex.message, 'the CLI profile is disabled');
    }

    delete process.env.ALIBABA_CLOUD_CLI_PROFILE_DISABLED;
  });

  it('getConfiguration', async function () {
    try {
      await getConfiguration(path.join(__dirname, '../fixtures/inexist_cli_config.json'));
      assert.fail();
    } catch (ex) {
      assert.ok(ex.message.startsWith('reading aliyun cli config from '));
    }

    try {
      await getConfiguration(path.join(__dirname, '../fixtures/invalid_cli_config.json'))
    } catch (ex) {
      assert.ok(ex.message.startsWith('parse aliyun cli config from '))
    }

    try {
      await getConfiguration(path.join(__dirname, '../fixtures/mock_empty_cli_config.json'))
    } catch (ex) {
      assert.ok(ex.message.startsWith('no any configured profiles in '))
    }

    let conf = await getConfiguration(path.join(__dirname, '../fixtures/mock_cli_config.json'))

    assert.deepStrictEqual(conf, {
      current: 'default',
      profiles: [
        {
          mode: 'AK',
          name: 'default',
          access_key_id: 'akid',
          access_key_secret: 'secret',
        },
        {
          mode: 'AK',
          name: 'jacksontian',
          access_key_id: 'akid',
          access_key_secret: 'secret',
        },
      ]
    })

    try {
      getProfile(conf, 'inexists');
    } catch (ex) {
      assert.strictEqual(ex.message, "unable to get profile with 'inexists'");
    }

    let p = getProfile(conf, 'jacksontian');

    assert.strictEqual(p.name, 'jacksontian');
    assert.strictEqual(p.mode, 'AK');
  });

  it('getCredentialsProvider() should ok', async function () {
    const conf = {
      current: 'AK',
      profiles: [
        {
          mode: 'AK',
          name: 'AK',
          access_key_id: 'akid',
          access_key_secret: 'secret',
        },
        {
          mode: 'RamRoleArn',
          name: 'RamRoleArn',
          access_key_id: 'akid',
          access_key_secret: 'secret',
          ram_role_arn: 'arn',
        },
        {
          mode: 'RamRoleArn',
          name: 'Invalid_RamRoleArn',
        },
        {
          mode: 'EcsRamRole',
          name: 'EcsRamRole',
          ram_role_name: 'rolename',
        },
        {
          mode: 'OIDC',
          name: 'OIDC',
          ram_role_arn: 'role_arn',
          oidc_token_file: 'path/to/oidc/file',
          oidc_provider_arn: 'provider_arn',
        },
        {
          mode: 'ChainableRamRoleArn',
          name: 'ChainableRamRoleArn',
          ram_role_arn: 'arn',
          source_profile: 'AK',
        },
        {
          mode: 'ChainableRamRoleArn',
          name: 'ChainableRamRoleArn2',
          source_profile: 'InvalidSource',
        },
        {
          mode: 'Unsupported',
          name: 'Unsupported',
        },
      ],
    };

    let provider = CLIProfileCredentialsProvider.builder().build()
    try {
      await (provider as any).getCredentialsProvider(conf, 'inexist')
      assert.fail();
    } catch (ex) {
      assert.strictEqual(ex.message, "unable to get profile with 'inexist'")
    }

    // AK
    let cp = await (provider as any).getCredentialsProvider(conf, 'AK') as CredentialsProvider;
    assert.strictEqual(cp.getProviderName(), 'static_ak');
    let cc = await cp.getCredentials();

    assert.deepStrictEqual(cc, Credentials.builder()
      .withAccessKeyId('akid')
      .withAccessKeySecret('secret')
      .withProviderName('static_ak')
      .build());
    // RamRoleArn
    cp = await (provider as any).getCredentialsProvider(conf, 'RamRoleArn')

    assert.ok(cp instanceof RAMRoleARNCredentialsProvider)

    // RamRoleArn invalid ak
    try {
      await (provider as any).getCredentialsProvider(conf, 'Invalid_RamRoleArn')
      assert.fail();
    } catch (ex) {
      assert.strictEqual(ex.message, 'the access key id is empty')
    }

    // EcsRamRole
    cp = await (provider as any).getCredentialsProvider(conf, 'EcsRamRole')
    assert.ok(cp instanceof ECSRAMRoleCredentialsProvider)

    // OIDC
    cp = await (provider as any).getCredentialsProvider(conf, 'OIDC')
    assert.ok(cp instanceof OIDCRoleArnCredentialsProvider)

    // ChainableRamRoleArn
    cp = await (provider as any).getCredentialsProvider(conf, 'ChainableRamRoleArn')

    assert.ok(cp instanceof RAMRoleARNCredentialsProvider)


    // ChainableRamRoleArn with invalid source profile
    try {
      await (provider as any).getCredentialsProvider(conf, 'ChainableRamRoleArn2')
      assert.fail();
    } catch (ex) {
      assert.strictEqual(ex.message, "unable to get profile with 'InvalidSource'")
    }
    // Unsupported
    try {
      await (provider as any).getCredentialsProvider(conf, 'Unsupported')
      assert.fail();
    } catch (ex) {
      assert.strictEqual(ex.message, "unsupported profile mode 'Unsupported'")
    }
  });

  it('getCredentials() should ok', async function () {
    let provider = CLIProfileCredentialsProvider.builder().build();
    (provider as any).homedir = '';

    try {
      await (provider as any).getCredentials();
      assert.fail();
    } catch (ex) {
      assert.strictEqual(ex.message, 'cannot found home dir')
    }

    (provider as any).homedir = '/path/invalid/home/dir';
    try {
      await (provider as any).getCredentials();
      assert.fail();
    } catch (ex) {
      assert.strictEqual(ex.message, "reading aliyun cli config from '/path/invalid/home/dir/.aliyun/config.json' failed.")
    }

    // get credentials by current profile
    provider = CLIProfileCredentialsProvider.builder().build();
    (provider as any).homedir = path.join(__dirname, '../fixtures');
    let cc = await (provider as any).getCredentials();
    assert.deepStrictEqual(cc, Credentials.builder()
      .withAccessKeyId('akid')
      .withAccessKeySecret('secret')
      .withProviderName('cli_profile/static_ak')
      .build());

    provider = CLIProfileCredentialsProvider.builder()
      .withProfileName('inexist')
      .build();
    (provider as any).homedir = path.join(__dirname, '../fixtures');
    try {
      await (provider as any).getCredentials();
      assert.fail();
    } catch (ex) {
      assert.strictEqual(ex.message, "unable to get profile with 'inexist'")
    }

    // The get_credentials_error profile is invalid
    provider = CLIProfileCredentialsProvider.builder()
      .withProfileName('get_credentials_error')
      .build();
    (provider as any).homedir = path.join(__dirname, '../fixtures');
    try {
      await (provider as any).getCredentials();
      assert.fail();
    } catch (ex) {
      assert.ok(ex.message.includes('InvalidAccessKeyId.NotFound'));
    }

    // get credentials again
    try {
      await (provider as any).getCredentials();
      assert.fail();
    } catch (ex) {
      assert.ok(ex.message.includes('InvalidAccessKeyId.NotFound'));
    }
  });

});