import 'mocha';
import assert from 'assert'

import StaticSTSCredentialsProvider from '../../src/providers/static_sts';

describe('StaticSTSCredentialsProvider', function () {
  it('should failed when no accessKeyId', async function () {
    assert.throws(() => {
      StaticSTSCredentialsProvider.builder().build();
    }, (err: Error) => {
      assert.strictEqual('the access key id is empty', err.message);
      return true;
    });

    assert.throws(() => {
      StaticSTSCredentialsProvider.builder()
        .withAccessKeyId('akid')
        .build();
    }, (err: Error) => {
      assert.strictEqual('the access key secret is empty', err.message);
      return true;
    });

    assert.throws(() => {
      StaticSTSCredentialsProvider.builder()
        .withAccessKeyId('akid')
        .withAccessKeySecret('aksecret')
        .build();
    }, (err: Error) => {
      assert.strictEqual('the security token is empty', err.message);
      return true;
    });

    assert.doesNotThrow(() => {
      StaticSTSCredentialsProvider
        .builder()
        .withAccessKeyId('accessKeyId')
        .withAccessKeySecret('accessKeySecret')
        .withSecurityToken('token')
        .build();
    });
  });

  it('should ok', async function () {
    const provider = StaticSTSCredentialsProvider
      .builder()
      .withAccessKeyId('accessKeyId')
      .withAccessKeySecret('accessKeySecret')
      .withSecurityToken('token')
      .build();
    assert.strictEqual('static_sts', provider.getProviderName());

    const credentials = await provider.getCredentials();
    assert.strictEqual('accessKeyId', credentials.accessKeyId);
    assert.strictEqual('accessKeySecret', credentials.accessKeySecret);
    assert.strictEqual('token', credentials.securityToken);
    assert.strictEqual('static_sts', credentials.providerName);
  });

  describe('should ok with env', () => {
    before(() => {
      process.env['ALIBABA_CLOUD_ACCESS_KEY_ID'] = 'akid_from_env';
      process.env['ALIBABA_CLOUD_ACCESS_KEY_SECRET'] = 'aksecret_from_env';
      process.env['ALIBABA_CLOUD_SECURITY_TOKEN'] = 'token_from_env';
    });

    after(() => {
      delete process.env['ALIBABA_CLOUD_ACCESS_KEY_ID'];
      delete process.env['ALIBABA_CLOUD_ACCESS_KEY_SECRET'];
      delete process.env['ALIBABA_CLOUD_SECURITY_TOKEN'];
    });

    it('should ok with env', async function () {
      const provider = StaticSTSCredentialsProvider
        .builder()
        .build();
      assert.strictEqual('static_sts', provider.getProviderName());
    
      const credentials = await provider.getCredentials();
      assert.strictEqual('akid_from_env', credentials.accessKeyId);
      assert.strictEqual('aksecret_from_env', credentials.accessKeySecret);
      assert.strictEqual('token_from_env', credentials.securityToken);
      assert.strictEqual('static_sts', credentials.providerName);
    });
  });
});
