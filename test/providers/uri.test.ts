import assert from 'assert';
import URICredentialsProvider from '../../src/providers/uri';
import { Response } from '../../src/providers/http';

describe('URICredentialsProvider', function () {
  it('URICredentialsProvider', async function () {
    let p = URICredentialsProvider.builder().build()
    assert.ok(!(p as any).credentialsURI)

    p = URICredentialsProvider.builder()
      .withCredentialsURI('http://127.0.0.1:9999')
      .build()
    assert.strictEqual((p as any).credentialsURI, 'http://127.0.0.1:9999');

    assert.ok((p as any).needUpdateCredential());
  });

  it('getCredentials() should ok', async function () {
    const p = URICredentialsProvider.builder()
      .withCredentialsURI('http://127.0.0.1:9999')
      .withReadTimeout(1000)
      .withConnectTimeout(1000)
      .build();

    const expiration = new Date();
    (p as any).doRequest = async function () {
      return Response.builder()
        .withStatusCode(200)
        .withBody(Buffer.from(`{"AccessKeyId":"akid","AccessKeySecret":"aksecret","Expiration":"${expiration.toISOString()}","SecurityToken":"ststoken"}`))
        .build();
    };

    let cc = await p.getCredentials()
    assert.strictEqual(cc.accessKeyId, 'akid');
    assert.strictEqual(cc.accessKeySecret, 'aksecret');
    assert.strictEqual(cc.securityToken, 'ststoken')
    assert.strictEqual(cc.providerName, 'credential_uri');
    assert.ok((p as any).needUpdateCredential() === true);

    // get credentials again
    (p as any).expirationTimestamp = Date.now() / 1000 + 300;
    cc = await p.getCredentials()
    assert.strictEqual(cc.accessKeyId, 'akid');
    assert.strictEqual(cc.accessKeySecret, 'aksecret');
    assert.strictEqual(cc.securityToken, 'ststoken')
    assert.strictEqual(cc.providerName, 'credential_uri');
    assert.ok((p as any).needUpdateCredential() === false);
  });

  it('getCredentials() with error', async function () {
    const p = URICredentialsProvider.builder()
      .withCredentialsURI('http://127.0.0.1:9999')
      .withReadTimeout(1000)
      .withConnectTimeout(1000)
      .build();

    try {
      await p.getCredentials();
      assert.fail('should not to be here');
    } catch (ex) {
      assert.ok(ex.message.includes(`ECONNREFUSED`));
    }

    (p as any).doRequest = async function () {
      return Response.builder()
        .withStatusCode(400)
        .withBody(Buffer.from(`error`))
        .build();
    };

    try {
      await p.getCredentials();
      assert.fail('should not to be here');
    } catch (ex) {
      assert.strictEqual(ex.message, 'get sts token failed, httpStatus: 400, message = error.');
    }

    (p as any).doRequest = async function () {
      return Response.builder()
        .withStatusCode(200)
        .withBody(Buffer.from(`{"AccessKeyId":"akid"}`))
        .build();
    };

    try {
      await p.getCredentials();
      assert.fail('should not to be here');
    } catch (ex) {
      assert.strictEqual(ex.message, 'error retrieving credentials from credentialsURI result: {"AccessKeyId":"akid"}.');
    }

    (p as any).doRequest = async function () {
      return Response.builder()
        .withStatusCode(200)
        .withBody(Buffer.from(`error json`))
        .build();
    };

    try {
      await p.getCredentials();
      assert.fail('should not to be here');
    } catch (ex) {
      assert.strictEqual(ex.message, 'get sts token failed, json parse failed: Unexpected token e in JSON at position 0, result: error json.');
    }
  });

  it('env ALIBABA_CLOUD_CREDENTIALS_URI should ok', async function () {
    process.env.ALIBABA_CLOUD_CREDENTIALS_URI = 'http://127.0.0.1:9999';
    let p = URICredentialsProvider.builder().build();
    assert.strictEqual((p as any).credentialsURI, 'http://127.0.0.1:9999');

    delete process.env.ALIBABA_CLOUD_CREDENTIALS_URI;
  });
});
