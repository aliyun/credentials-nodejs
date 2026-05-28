import 'mocha';
import assert from 'assert';

import OAuthCredentialsProvider from '../../src/providers/oauth';
import { Request, Response } from '../../src/providers/http';

describe('OAuthCredentialsProvider', function () {
  it('should validate builder parameters', function () {
    assert.throws(() => {
      OAuthCredentialsProvider.builder().build();
    }, (err: Error) => {
      assert.strictEqual(err.message, 'the clientId is empty');
      return true;
    });

    assert.throws(() => {
      OAuthCredentialsProvider.builder()
        .withClientId('clientId')
        .build();
    }, (err: Error) => {
      assert.strictEqual(err.message, 'the url for sign-in is empty');
      return true;
    });

    const p = OAuthCredentialsProvider.builder()
      .withClientId('clientId')
      .withSignInUrl('https://oauth.aliyun.com')
      .build();
    assert.ok(p);
  });

  it('getCredentialsInternal() should return credentials on success (no refresh)', async function () {
    const p = OAuthCredentialsProvider.builder()
      .withClientId('clientId')
      .withSignInUrl('https://oauth.aliyun.com')
      .withAccessToken('token')
      .withAccessTokenExpire(Math.floor(Date.now() / 1000) + 2000)
      .build();

    (p as any).doRequest = async function () {
      return Response.builder()
        .withStatusCode(200)
        .withBody(Buffer.from('{"accessKeyId":"ak","accessKeySecret":"sk","securityToken":"token","expiration":"2021-10-20T04:27:09Z"}'))
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
    const p = OAuthCredentialsProvider.builder()
      .withClientId('clientId')
      .withSignInUrl('https://oauth.aliyun.com')
      .withAccessToken('token')
      .withAccessTokenExpire(Math.floor(Date.now() / 1000) + 2000)
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
    const p = OAuthCredentialsProvider.builder()
      .withClientId('clientId')
      .withSignInUrl('https://oauth.aliyun.com')
      .withAccessToken('token')
      .withAccessTokenExpire(Math.floor(Date.now() / 1000) + 2000)
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
      assert.strictEqual(ex.message, 'get session token from OAuth failed: bad request');
    }
  });

  it('getCredentialsInternal() should throw on missing fields', async function () {
    const p = OAuthCredentialsProvider.builder()
      .withClientId('clientId')
      .withSignInUrl('https://oauth.aliyun.com')
      .withAccessToken('token')
      .withAccessTokenExpire(Math.floor(Date.now() / 1000) + 2000)
      .build();

    (p as any).doRequest = async function () {
      return Response.builder()
        .withStatusCode(200)
        .withBody(Buffer.from('{"accessKeyId":"ak"}'))
        .withHeaders({})
        .build();
    };

    try {
      await (p as any).getCredentialsInternal();
      assert.fail('should not run to here');
    } catch (ex) {
      assert.ok(ex.message.startsWith('refresh session token from OAuth failed, fail to get credentials:'));
    }
  });

  it('should trigger token refresh when accessToken is expired', async function () {
    const p = OAuthCredentialsProvider.builder()
      .withClientId('clientId')
      .withSignInUrl('https://oauth.aliyun.com')
      .withRefreshToken('refreshToken')
      .withAccessToken('expiredToken')
      .withAccessTokenExpire(Math.floor(Date.now() / 1000) - 100)
      .build();

    let refreshCalled = false;
    (p as any).doRequest = async function (req: Request) {
      if (req.path === '/v1/token') {
        refreshCalled = true;
        return Response.builder()
          .withStatusCode(200)
          .withBody(Buffer.from('{"access_token":"newAccessToken","refresh_token":"newRefreshToken","expires_in":3600}'))
          .withHeaders({})
          .build();
      }
      if (req.path === '/v1/exchange') {
        return Response.builder()
          .withStatusCode(200)
          .withBody(Buffer.from('{"accessKeyId":"ak","accessKeySecret":"sk","securityToken":"token","expiration":"2021-10-20T04:27:09Z"}'))
          .withHeaders({})
          .build();
      }
      throw new Error('unexpected request path: ' + req.path);
    };

    const creds = await (p as any).getCredentialsInternal();
    assert.ok(refreshCalled);
    assert.strictEqual(creds.accessKeyId, 'ak');
    assert.strictEqual(creds.accessKeySecret, 'sk');
    assert.strictEqual(creds.securityToken, 'token');
  });

  it('should throw when token refresh fails', async function () {
    const p = OAuthCredentialsProvider.builder()
      .withClientId('clientId')
      .withSignInUrl('https://oauth.aliyun.com')
      .withRefreshToken('refreshToken')
      .withAccessToken('expiredToken')
      .withAccessTokenExpire(Math.floor(Date.now() / 1000) - 100)
      .build();

    (p as any).doRequest = async function (req: Request) {
      if (req.path === '/v1/token') {
        return Response.builder()
          .withStatusCode(400)
          .withBody(Buffer.from('refresh failed'))
          .withHeaders({})
          .build();
      }
      throw new Error('unexpected request');
    };

    try {
      await (p as any).getCredentialsInternal();
      assert.fail('should not run to here');
    } catch (ex) {
      assert.strictEqual(ex.message, 'failed to refresh OAuth token, status code: 400');
    }
  });

  it('tokenUpdateCallback should be called on success', async function () {
    let callbackInvoked = false;
    let callbackArgs: any[] = [];

    const p = OAuthCredentialsProvider.builder()
      .withClientId('clientId')
      .withSignInUrl('https://oauth.aliyun.com')
      .withAccessToken('token')
      .withAccessTokenExpire(Math.floor(Date.now() / 1000) + 2000)
      .withTokenUpdateCallback(async (refreshToken, accessToken, accessKeyId, accessKeySecret, securityToken, accessTokenExpire, stsExpire) => {
        callbackInvoked = true;
        callbackArgs = [refreshToken, accessToken, accessKeyId, accessKeySecret, securityToken, accessTokenExpire, stsExpire];
      })
      .build();

    (p as any).doRequest = async function () {
      return Response.builder()
        .withStatusCode(200)
        .withBody(Buffer.from('{"accessKeyId":"ak","accessKeySecret":"sk","securityToken":"token","expiration":"2021-10-20T04:27:09Z"}'))
        .withHeaders({})
        .build();
    };

    await (p as any).getCredentialsInternal();
    assert.ok(callbackInvoked);
    assert.strictEqual(callbackArgs[2], 'ak');
    assert.strictEqual(callbackArgs[3], 'sk');
    assert.strictEqual(callbackArgs[4], 'token');
  });

  it('tokenUpdateCallback error should not break credential retrieval', async function () {
    const p = OAuthCredentialsProvider.builder()
      .withClientId('clientId')
      .withSignInUrl('https://oauth.aliyun.com')
      .withAccessToken('token')
      .withAccessTokenExpire(Math.floor(Date.now() / 1000) + 2000)
      .withTokenUpdateCallback(async () => {
        throw new Error('callback error');
      })
      .build();

    (p as any).doRequest = async function () {
      return Response.builder()
        .withStatusCode(200)
        .withBody(Buffer.from('{"accessKeyId":"ak","accessKeySecret":"sk","securityToken":"token","expiration":"2021-10-20T04:27:09Z"}'))
        .withHeaders({})
        .build();
    };

    const creds = await (p as any).getCredentialsInternal();
    assert.strictEqual(creds.accessKeyId, 'ak');
    assert.strictEqual(creds.accessKeySecret, 'sk');
    assert.strictEqual(creds.securityToken, 'token');
  });

  it('getProviderName() should return oauth', function () {
    const p = OAuthCredentialsProvider.builder()
      .withClientId('clientId')
      .withSignInUrl('https://oauth.aliyun.com')
      .build();

    assert.strictEqual(p.getProviderName(), 'oauth');
  });
});
