import 'mocha';
import assert from 'assert';
import * as os from 'os';

import ExternalCredentialsProvider from '../../src/providers/external';

describe('ExternalCredentialsProvider', function () {
  it('should validate builder parameters', function () {
    assert.throws(() => {
      ExternalCredentialsProvider.builder().build();
    }, (err: Error) => {
      assert.strictEqual(err.message, 'process_command is empty');
      return true;
    });
  });

  // Process-command cases rely on /bin/echo (absent on Windows).
  describe('process command', function () {
    before(function () {
      if (os.platform() === 'win32') {
        this.skip();
      }
    });

    it('should return AK credentials', async function () {
      const p = ExternalCredentialsProvider.builder()
        // JSON must be single-quoted so shlex-like split keeps " inside the arg.
        .withProcessCommand('/bin/echo \'{"mode":"AK","access_key_id":"ak","access_key_secret":"sk"}\'')
        .build();

      const creds = await p.getCredentials();
      assert.strictEqual(creds.accessKeyId, 'ak');
      assert.strictEqual(creds.accessKeySecret, 'sk');
      assert.strictEqual(creds.securityToken, undefined);
      assert.strictEqual(creds.providerName, 'external');
    });

    it('should return STS credentials and invoke callback', async function () {
      let callbackArgs: any[] = [];
      const p = ExternalCredentialsProvider.builder()
        .withProcessCommand('/bin/echo \'{"mode":"StsToken","access_key_id":"ak","access_key_secret":"sk","sts_token":"token","expiration":"2049-10-20T04:27:09Z"}\'')
        .withCredentialUpdateCallback((accessKeyId, accessKeySecret, securityToken, expiration) => {
          callbackArgs = [accessKeyId, accessKeySecret, securityToken, expiration];
        })
        .build();

      const creds = await p.getCredentials();
      assert.strictEqual(creds.accessKeyId, 'ak');
      assert.strictEqual(creds.accessKeySecret, 'sk');
      assert.strictEqual(creds.securityToken, 'token');
      assert.strictEqual(callbackArgs[2], 'token');
      assert.ok(callbackArgs[3] > 0);
    });

    it('should refresh on every call when expiration is absent', async function () {
      let callbackCount = 0;
      const p = ExternalCredentialsProvider.builder()
        .withProcessCommand('/bin/echo \'{"mode":"AK","access_key_id":"ak","access_key_secret":"sk"}\'')
        .withCredentialUpdateCallback(() => {
          callbackCount++;
        })
        .build();

      await p.getCredentials();
      await p.getCredentials();
      assert.strictEqual(callbackCount, 2);
    });

    it('should ignore callback errors', async function () {
      const p = ExternalCredentialsProvider.builder()
        .withProcessCommand('/bin/echo \'{"mode":"AK","access_key_id":"ak","access_key_secret":"sk"}\'')
        .withCredentialUpdateCallback(() => {
          throw new Error('callback error');
        })
        .build();

      const creds = await p.getCredentials();
      assert.strictEqual(creds.accessKeyId, 'ak');
    });

    it('should validate response fields', async function () {
      const p = ExternalCredentialsProvider.builder()
        .withProcessCommand('/bin/echo \'{"mode":"StsToken","access_key_id":"ak","access_key_secret":"sk"}\'')
        .build();

      try {
        await p.getCredentials();
        assert.fail('should not run to here');
      } catch (ex) {
        assert.strictEqual(ex.message, 'invalid StsToken credential response: sts_token is empty');
      }
    });
  });
});
