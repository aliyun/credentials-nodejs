import 'mocha';
import assert from 'assert'

import StaticAKCredentialsProvider from '../../src/providers/static_ak';

describe('StaticAKCredentialsProvider', function () {
  it('should failed when no accessKeyId', async function () {
    assert.throws(() => {
      StaticAKCredentialsProvider.builder().build();
    }, (err: Error) => {
      assert.strictEqual('the access key id is empty', err.message);
      return true;
    });

    assert.throws(() => {
      StaticAKCredentialsProvider.builder().withAccessKeyId('akid').build();
    }, (err: Error) => {
      assert.strictEqual('the access key secret is empty', err.message);
      return true;
    });

    assert.doesNotThrow(() => {
      StaticAKCredentialsProvider
        .builder()
        .withAccessKeyId('accessKeyId')
        .withAccessKeySecret('accessKeySecret')
        .build();
    });
  });

  it('should ok', async function () {
    const provider = StaticAKCredentialsProvider
      .builder()
      .withAccessKeyId('accessKeyId')
      .withAccessKeySecret('accessKeySecret')
      .build();
    assert.strictEqual('static_ak', provider.getProviderName());

    const credentials = await provider.getCredentials();
    assert.strictEqual('accessKeyId', credentials.accessKeyId);
    assert.strictEqual('accessKeySecret', credentials.accessKeySecret);
    assert.strictEqual(undefined, credentials.securityToken);
    assert.strictEqual('static_ak', credentials.providerName);
  });

  describe('should ok with env', () => {
    before(() => {
      process.env['ALIBABA_CLOUD_ACCESS_KEY_ID'] = 'akid_from_env';
      process.env['ALIBABA_CLOUD_ACCESS_KEY_SECRET'] = 'aksecret_from_env';
    });

    after(() => {
      delete process.env['ALIBABA_CLOUD_ACCESS_KEY_ID'];
      delete process.env['ALIBABA_CLOUD_ACCESS_KEY_SECRET'];
    });

    it('should ok with env', async function () {
      const provider = StaticAKCredentialsProvider
        .builder()
        .build();
      assert.strictEqual('static_ak', provider.getProviderName());
    
      const credentials = await provider.getCredentials();
      assert.strictEqual('akid_from_env', credentials.accessKeyId);
      assert.strictEqual('aksecret_from_env', credentials.accessKeySecret);
      assert.strictEqual(undefined, credentials.securityToken);
      assert.strictEqual('static_ak', credentials.providerName);
    });
  });
});
