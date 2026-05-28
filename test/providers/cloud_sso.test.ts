import 'mocha';
import assert from 'assert';

import CloudSSOCredentialsProvider from '../../src/providers/cloud_sso';
import { Response } from '../../src/providers/http';

describe('CloudSSOCredentialsProvider', function () {
  it('should validate builder parameters', function () {
    assert.throws(() => {
      CloudSSOCredentialsProvider.builder().build();
    }, (err: Error) => {
      assert.strictEqual(err.message, 'CloudSSO access token is empty or expired, please re-login with cli.');
      return true;
    });

    assert.throws(() => {
      CloudSSOCredentialsProvider.builder()
        .withAccessToken('token')
        .withAccessTokenExpire(0)
        .build();
    }, (err: Error) => {
      assert.strictEqual(err.message, 'CloudSSO access token is empty or expired, please re-login with cli.');
      return true;
    });

    assert.throws(() => {
      CloudSSOCredentialsProvider.builder()
        .withAccessToken('token')
        .withAccessTokenExpire(Math.floor(Date.now() / 1000) + 1000)
        .build();
    }, (err: Error) => {
      assert.strictEqual(err.message, 'CloudSSO sign in url, account id, and access config cannot be empty.');
      return true;
    });

    assert.throws(() => {
      CloudSSOCredentialsProvider.builder()
        .withAccessToken('token')
        .withAccessTokenExpire(Math.floor(Date.now() / 1000) + 1000)
        .withSignInUrl('https://signin.aliyun.com')
        .build();
    }, (err: Error) => {
      assert.strictEqual(err.message, 'CloudSSO sign in url, account id, and access config cannot be empty.');
      return true;
    });

    const p = CloudSSOCredentialsProvider.builder()
      .withSignInUrl('https://signin.aliyun.com')
      .withAccountId('123456')
      .withAccessConfig('config')
      .withAccessToken('token')
      .withAccessTokenExpire(Math.floor(Date.now() / 1000) + 1000)
      .build();
    assert.ok(p);
  });

  it('getCredentialsInternal() should return credentials on success', async function () {
    const p = CloudSSOCredentialsProvider.builder()
      .withSignInUrl('https://signin.aliyun.com')
      .withAccountId('123456')
      .withAccessConfig('config')
      .withAccessToken('token')
      .withAccessTokenExpire(Math.floor(Date.now() / 1000) + 1000)
      .build();

    (p as any).doRequest = async function () {
      return Response.builder()
        .withStatusCode(200)
        .withBody(Buffer.from('{"CloudCredential":{"AccessKeyId":"ak","AccessKeySecret":"sk","SecurityToken":"token","Expiration":"2021-10-20T04:27:09Z"}}'))
        .withHeaders({})
        .build();
    };

    const creds = await (p as any).getCredentialsInternal();
    assert.strictEqual(creds.accessKeyId, 'ak');
    assert.strictEqual(creds.accessKeySecret, 'sk');
    assert.strictEqual(creds.securityToken, 'token');
    assert.strictEqual(creds.expiration, '2021-10-20T04:27:09Z');
  });

  it('getCredentialsInternal() should throw on server error', async function () {
    const p = CloudSSOCredentialsProvider.builder()
      .withSignInUrl('https://signin.aliyun.com')
      .withAccountId('123456')
      .withAccessConfig('config')
      .withAccessToken('token')
      .withAccessTokenExpire(Math.floor(Date.now() / 1000) + 1000)
      .build();

    (p as any).doRequest = async function () {
      throw new Error('mock server error');
    };

    try {
      await (p as any).getCredentialsInternal();
      assert.fail('should not run to here');
    } catch (ex) {
      assert.strictEqual(ex.message, 'mock server error');
    }
  });

  it('getCredentialsInternal() should throw on 4xx error', async function () {
    const p = CloudSSOCredentialsProvider.builder()
      .withSignInUrl('https://signin.aliyun.com')
      .withAccountId('123456')
      .withAccessConfig('config')
      .withAccessToken('token')
      .withAccessTokenExpire(Math.floor(Date.now() / 1000) + 1000)
      .build();

    (p as any).doRequest = async function () {
      return Response.builder()
        .withStatusCode(400)
        .withBody(Buffer.from('bad request'))
        .withHeaders({})
        .build();
    };

    try {
      await (p as any).getCredentialsInternal();
      assert.fail('should not run to here');
    } catch (ex) {
      assert.strictEqual(ex.message, 'get session token from CloudSSO failed: bad request');
    }
  });

  it('getCredentialsInternal() should throw on invalid json', async function () {
    const p = CloudSSOCredentialsProvider.builder()
      .withSignInUrl('https://signin.aliyun.com')
      .withAccountId('123456')
      .withAccessConfig('config')
      .withAccessToken('token')
      .withAccessTokenExpire(Math.floor(Date.now() / 1000) + 1000)
      .build();

    (p as any).doRequest = async function () {
      return Response.builder()
        .withStatusCode(200)
        .withBody(Buffer.from('invalid json'))
        .withHeaders({})
        .build();
    };

    try {
      await (p as any).getCredentialsInternal();
      assert.fail('should not run to here');
    } catch (ex) {
      assert.strictEqual(ex.message, 'get session token from CloudSSO failed, unmarshal fail: invalid json');
    }
  });

  it('getCredentialsInternal() should throw on missing credentials', async function () {
    const p = CloudSSOCredentialsProvider.builder()
      .withSignInUrl('https://signin.aliyun.com')
      .withAccountId('123456')
      .withAccessConfig('config')
      .withAccessToken('token')
      .withAccessTokenExpire(Math.floor(Date.now() / 1000) + 1000)
      .build();

    (p as any).doRequest = async function () {
      return Response.builder()
        .withStatusCode(200)
        .withBody(Buffer.from('{"CloudCredential":{}}'))
        .withHeaders({})
        .build();
    };

    try {
      await (p as any).getCredentialsInternal();
      assert.fail('should not run to here');
    } catch (ex) {
      assert.strictEqual(ex.message, 'get session token from CloudSSO failed, fail to get credentials');
    }
  });

  it('getProviderName() should return cloud_sso', function () {
    const p = CloudSSOCredentialsProvider.builder()
      .withSignInUrl('https://signin.aliyun.com')
      .withAccountId('123456')
      .withAccessConfig('config')
      .withAccessToken('token')
      .withAccessTokenExpire(Math.floor(Date.now() / 1000) + 1000)
      .build();

    assert.strictEqual(p.getProviderName(), 'cloud_sso');
  });
});
