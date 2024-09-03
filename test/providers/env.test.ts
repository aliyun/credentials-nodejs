import assert from 'assert';

import EnvironmentVariableCredentialsProvider from '../../src/providers/env';


describe('EnvironmentVariableCredentialsProvider', function () {
  it('should ok', async function () {

    let p = EnvironmentVariableCredentialsProvider.builder().build();

    try {
      await p.getCredentials();
      assert.fail();
    } catch (ex) {
      assert.strictEqual(ex.message, 'unable to get credentials from enviroment variables, Access key ID must be specified via environment variable (ALIBABA_CLOUD_ACCESS_KEY_ID)')
    }

    process.env.ALIBABA_CLOUD_ACCESS_KEY_ID ='akid';
    try {
      await p.getCredentials();
      assert.fail();
    } catch (ex) {
      assert.strictEqual(ex.message, 'unable to get credentials from enviroment variables, Access key secret must be specified via environment variable (ALIBABA_CLOUD_ACCESS_KEY_SECRET)')
    }

    process.env.ALIBABA_CLOUD_ACCESS_KEY_SECRET ='aksecret'
    let cc = await p.getCredentials();

    assert.strictEqual('akid', cc.accessKeyId)
    assert.strictEqual('aksecret', cc.accessKeySecret)
    assert.ok(!cc.securityToken)
    assert.strictEqual('env', cc.providerName)

    process.env.ALIBABA_CLOUD_SECURITY_TOKEN = 'token';
    cc = await p.getCredentials();

    assert.strictEqual('akid', cc.accessKeyId)
    assert.strictEqual('aksecret', cc.accessKeySecret)
    assert.strictEqual('token', cc.securityToken)
    assert.strictEqual('env', cc.providerName);
    delete process.env.ALIBABA_CLOUD_ACCESS_KEY_ID;
    delete process.env.ALIBABA_CLOUD_ACCESS_KEY_SECRET;
    delete process.env.ALIBABA_CLOUD_SECURITY_TOKEN;
  });

});
