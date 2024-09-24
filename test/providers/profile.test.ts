import * as ini from 'ini';

const inistr = `
[default]
enable = true
type = access_key
access_key_id = foo
access_key_secret = bar

[notype]
access_key_id = foo
access_key_secret = bar

[noak]
type = access_key
access_key_secret = bar

[emptyak]
type = access_key
access_key_id =
access_key_secret = bar

[ecs]
type = ecs_ram_role
role_name = EcsRamRoleTest

[noecs]
type = ecs_ram_role

[emptyecs]
type = ecs_ram_role
role_name =

[ram]
type = ram_role_arn
access_key_id = foo
access_key_secret = bar
role_arn = role_arn
role_session_name = session_name

[noram]
type = ram_role_arn
access_key_secret = bar
role_arn = role_arn
role_session_name = session_name

[emptyram]
type = ram_role_arn
access_key_id =
access_key_secret = bar
role_arn = role_arn
role_session_name = session_name

[rsa]
type = rsa_key_pair
public_key_id = publicKeyId
private_key_file = ./pk.pem

[norsa]
type = rsa_key_pair
public_key_id = publicKeyId

[emptyrsa]
type = rsa_key_pair
public_key_id = publicKeyId
private_key_file =

[error_rsa]
type = rsa_key_pair
public_key_id = publicKeyId
private_key_file = ./pk_error.pem

[error_type]
type = error_type
public_key_id = publicKeyId
private_key_file = ./pk_error.pem
`

import 'mocha';
import assert from 'assert'
import path from 'path';

import ProfileCredentialsProvider from '../../src/providers/profile';
import Credentials from '../../src/credentials';
import StaticAKCredentialsProvider from '../../src/providers/static_ak';
import ECSRAMRoleCredentialsProvider from '../../src/providers/ecs_ram_role';
import RAMRoleARNCredentialsProvider from '../../src/providers/ram_role_arn';

describe('ProfileCredentialsProvider', function () {
  it('should ok to build credentials provider', async function () {
    // rollback := utils.Memory("ALIBABA_CLOUD_PROFILE")
    // defer rollback()

    // profile name from specified
    let provider = ProfileCredentialsProvider.builder().withProfileName('custom').build()

    assert.strictEqual('custom', (provider as any).profileName)

    // profile name from env
    process.env.ALIBABA_CLOUD_PROFILE = 'profile_from_env';
    provider = ProfileCredentialsProvider.builder().build()

    assert.strictEqual('profile_from_env', (provider as any).profileName)

    // profile name from default
    process.env.ALIBABA_CLOUD_PROFILE = '';
    provider = ProfileCredentialsProvider.builder().build()
    assert.strictEqual('default', (provider as any).profileName);

    delete process.env.ALIBABA_CLOUD_PROFILE;
  });

  it('getCredentialsProvider should ok', async function () {
    let provider = ProfileCredentialsProvider.builder().withProfileName('custom').build()
    try {
      provider.getCredentialsProvider('');
      assert.fail();
    } catch (ex) {
      assert.strictEqual(ex.message, 'Can not find credential type for "custom"');
    }

    let file = ini.parse(inistr);

    // no type
    provider = ProfileCredentialsProvider.builder().withProfileName('notype').build()
    try {
      provider.getCredentialsProvider(file)
      assert.fail();
    } catch (ex) {
      assert.strictEqual(ex.message, 'Can not find credential type for "notype"');
    }

    // no ak
    provider = ProfileCredentialsProvider.builder().withProfileName('noak').build()
    try {
      provider.getCredentialsProvider(file)
      assert.fail();
    } catch (ex) {
      assert.strictEqual(ex.message, 'the access key id is empty');
    }

    // value is empty
    provider = ProfileCredentialsProvider.builder().withProfileName('emptyak').build();
    try {
      provider.getCredentialsProvider(file)
      assert.fail();
    } catch (ex) {
      assert.strictEqual(ex.message, 'the access key id is empty');
    }

    // static ak provider
    provider = ProfileCredentialsProvider.builder().build()

    let cp = provider.getCredentialsProvider(file)

    assert.ok(cp instanceof StaticAKCredentialsProvider);
    let cc = await cp.getCredentials();

    assert.deepStrictEqual(cc, Credentials.builder()
      .withAccessKeyId('foo')
      .withAccessKeySecret('bar')
      .withProviderName('static_ak')
      .build());

    // ecs_ram_role without rolename
    provider = ProfileCredentialsProvider.builder().withProfileName('noecs').build();
    cp = provider.getCredentialsProvider(file);
    assert.ok(cp instanceof ECSRAMRoleCredentialsProvider);

    // ecs_ram_role with rolename
    provider = ProfileCredentialsProvider.builder().withProfileName('ecs').build()
    cp = provider.getCredentialsProvider(file)
    assert.ok(cp instanceof ECSRAMRoleCredentialsProvider);

    // ram role arn without keys
    provider = ProfileCredentialsProvider.builder().withProfileName('noram').build()
    try {
      provider.getCredentialsProvider(file);
      assert.fail();
    } catch (ex) {
      assert.strictEqual(ex.message, `the access key id is empty`);
    }

    // ram role arn without values
    provider = ProfileCredentialsProvider.builder().withProfileName('emptyram').build()
    try {
      provider.getCredentialsProvider(file);
      assert.fail();
    } catch (ex) {
      assert.strictEqual(ex.message, `the access key id is empty`);
    }

    // normal ram role arn
    provider = ProfileCredentialsProvider.builder().withProfileName('ram').build()

    cp = provider.getCredentialsProvider(file);
    assert.ok(cp instanceof RAMRoleARNCredentialsProvider);

    // unsupported type
    provider = ProfileCredentialsProvider.builder().withProfileName('error_type').build()
    try {
      provider.getCredentialsProvider(file);
    } catch (ex) {
      assert.strictEqual(ex.message, 'Invalid type option, support: access_key, ecs_ram_role, ram_role_arn');
    }
  });

  it('getCredentials should ok', async function () {
    // testcase: empty home
    let provider = ProfileCredentialsProvider.builder().withProfileName('custom').build();
    (provider as any).homedir = '';
    try {
      await provider.getCredentials();
      assert.fail();
    } catch (ex) {
      assert.strictEqual(ex.message, 'cannot found home dir')
    }

    // testcase: invalid home
    provider = ProfileCredentialsProvider.builder().withProfileName('custom').build();
    (provider as any).homedir = '/path/invalid/home/dir';
    try {
      await provider.getCredentials();
      assert.fail();
    } catch (ex) {
      assert.strictEqual(ex.message, `ENOENT: no such file or directory, access '/path/invalid/home/dir/.alibabacloud/credentials'`);
    }

    // testcase: specify credentials file with env
    process.env.ALIBABA_CLOUD_CREDENTIALS_FILE = '/path/to/credentials.invalid';
    provider = ProfileCredentialsProvider.builder().withProfileName('custom').build()
    try {
      await provider.getCredentials();
      assert.fail();
    } catch (ex) {
      assert.strictEqual(ex.message, `ENOENT: no such file or directory, access '/path/to/credentials.invalid'`);
    }
    delete process.env.ALIBABA_CLOUD_CREDENTIALS_FILE;

    // get from credentials file
    provider = ProfileCredentialsProvider.builder().withProfileName('custom').build();
    (provider as any).homedir = path.join(__dirname, '../fixtures');
    try {
      await provider.getCredentials();
      assert.fail();
    } catch (ex) {
      assert.strictEqual(ex.message, `Can not find credential type for "custom"`)
    }

    provider = ProfileCredentialsProvider.builder().build();
    (provider as any).homedir = path.join(__dirname, '../fixtures');
    let cc = await provider.getCredentials();
    assert.deepStrictEqual(cc, Credentials.builder()
      .withAccessKeyId('foo')
      .withAccessKeySecret('bar')
      .withProviderName('profile/static_ak')
      .build())

    // get credentials again
    cc = await provider.getCredentials()
    assert.deepStrictEqual(cc, Credentials.builder()
      .withAccessKeyId('foo')
      .withAccessKeySecret('bar')
      .withProviderName('profile/static_ak')
      .build());

    delete process.env.ALIBABA_CLOUD_CREDENTIALS_FILE;
  });

});