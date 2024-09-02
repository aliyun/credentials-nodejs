import 'mocha';
import assert from 'assert'
import path from 'path';

import OIDCCredentialsProvider from '../../src/providers/oidc_role_arn';
import { Request, Response } from '../../src/providers/http';

describe('OIDCCredentialsProvider', function () {
  it('should ok to build credentials provider', async function () {
    assert.throws(() => {
      OIDCCredentialsProvider.builder().build();
    }, (err: Error) => {
      assert.strictEqual(err.message, 'roleArn does not exist and env ALIBABA_CLOUD_ROLE_ARN is null.');
      return true;
    });

    assert.throws(() => {
      OIDCCredentialsProvider.builder()
        .withRoleArn('roleArn')
        .build();
    }, (err: Error) => {
      assert.strictEqual(err.message, 'oidcProviderArn does not exist and env ALIBABA_CLOUD_OIDC_PROVIDER_ARN is null.');
      return true;
    });

    assert.throws(() => {
      OIDCCredentialsProvider.builder()
        .withRoleArn('roleArn')
        .withOIDCProviderArn('oidcProviderArn')
        .build();
    }, (err: Error) => {
      assert.strictEqual(err.message, 'oidcTokenFilePath is not exists and env ALIBABA_CLOUD_OIDC_TOKEN_FILE is null.');
      return true;
    });

    // should ok
    let p = OIDCCredentialsProvider.builder()
      .withRoleArn('roleArn')
      .withOIDCProviderArn('oidcProviderArn')
      .withOIDCTokenFilePath('/tmp/inexist')
      .build();

    // test for sts endpoint
    p = OIDCCredentialsProvider.builder()
      .withRoleArn('roleArn')
      .withOIDCProviderArn('oidcProviderArn')
      .withOIDCTokenFilePath('/tmp/inexist')
      .build();
    assert.strictEqual((p as any)['stsEndpoint'], 'sts.aliyuncs.com');


    p = OIDCCredentialsProvider.builder()
      .withRoleArn('roleArn')
      .withOIDCProviderArn('oidcProviderArn')
      .withOIDCTokenFilePath('/tmp/inexist')
      .withStsEndpoint('sts.cn-beijing.aliyuncs.com')
      .build();
    assert.strictEqual((p as any)['stsEndpoint'], 'sts.cn-beijing.aliyuncs.com')

    p = OIDCCredentialsProvider.builder()
      .withRoleArn('roleArn')
      .withOIDCProviderArn('oidcProviderArn')
      .withOIDCTokenFilePath('/tmp/inexist')
      .withStsRegionId('cn-hangzhou')
      .build();
    assert.strictEqual((p as any)['stsEndpoint'], 'sts.cn-hangzhou.aliyuncs.com')

    // test for roleSesssionName
    p = OIDCCredentialsProvider.builder()
      .withRoleArn('roleArn')
      .withOIDCProviderArn('oidcProviderArn')
      .withOIDCTokenFilePath('/tmp/inexist')
      .build();
    assert.ok((p as any)['roleSessionName'].startsWith('credentials-nodejs-'))

    p = OIDCCredentialsProvider.builder()
      .withRoleArn('roleArn')
      .withOIDCProviderArn('oidcProviderArn')
      .withOIDCTokenFilePath('/tmp/inexist')
      .withRoleSessionName('rsn')
      .build();
    assert.strictEqual((p as any)['roleSessionName'], 'rsn');

    // test for policy
    p = OIDCCredentialsProvider.builder()
      .withRoleArn('roleArn')
      .withOIDCProviderArn('oidcProviderArn')
      .withOIDCTokenFilePath('/tmp/inexist')
      .withPolicy('policydocument')
      .build();
    assert.strictEqual((p as any)['policy'], 'policydocument');

    // test for duration seconds
    assert.strictEqual((p as any)['durationSeconds'], 3600); // duration seconds defaults to 3600
    p = OIDCCredentialsProvider.builder()
      .withRoleArn('roleArn')
      .withOIDCProviderArn('oidcProviderArn')
      .withOIDCTokenFilePath('/tmp/inexist')
      .withDurationSeconds(3601)
      .build();
    assert.strictEqual((p as any)['durationSeconds'], 3601);

    // less than 900
    assert.throws(() => {
      OIDCCredentialsProvider.builder()
        .withRoleArn('roleArn')
        .withOIDCProviderArn('oidcProviderArn')
        .withOIDCTokenFilePath('/tmp/inexist')
        .withDurationSeconds(899)
        .build();
    }, (err: Error) => {
      assert.strictEqual(err.message, 'session duration should be in the range of 900s - max session duration');
      return true;
    });
  });

  it('getCredentialsInternal() should ok', async function () {
    let p = OIDCCredentialsProvider.builder()
      .withRoleArn('roleArn')
      .withOIDCProviderArn('oidcProviderArn')
      .withOIDCTokenFilePath(path.join(__dirname, '../fixtures/OIDCToken.txt'))
      .withDurationSeconds(1000)
      .build();

    // case 1: server error
    (p as any).doRequest = async function () {
      throw new Error('mock server error');
    };

    try {
      await (p as any).getCredentialsInternal();
      assert.fail('should not run to here');
    } catch (ex) {
      assert.strictEqual(ex.message, 'mock server error');
    }

    // case 2: 4xx error
    (p as any).doRequest = async function () {
      return Response.builder()
        .withStatusCode(400)
        .withBody(Buffer.from('4xx error'))
        .withHeaders({})
        .build();
    };

    try {
      await (p as any).getCredentialsInternal();
      assert.fail('should not run to here');
    } catch (ex) {
      assert.strictEqual(ex.message, 'get sts token failed with OIDC: 4xx error');
    }

    // case 3: invalid json
    (p as any).doRequest = async function () {
      return Response.builder().withStatusCode(200).withBody(Buffer.from('invalid json')).build();
    };

    try {
      await (p as any).getCredentialsInternal();
      assert.fail('should not run to here');
    } catch (ex) {
      assert.strictEqual(ex.message, `get sts token failed with OIDC, unmarshal fail: invalid json`);
    }
    // case 4: empty response json
    (p as any).doRequest = async function () {
      return Response.builder().withStatusCode(200).withBody(Buffer.from('null')).build();
    };

    try {
      await (p as any).getCredentialsInternal();
      assert.fail('should not run to here');
    } catch (ex) {
      assert.strictEqual(ex.message, `get sts token failed with OIDC`);
    }

    // case 5: empty session ak response json
    (p as any).doRequest = async function () {
      return Response.builder().withStatusCode(200).withBody(Buffer.from(`{"Credentials": {}}`)).build();
    };

    try {
      await (p as any).getCredentialsInternal();
      assert.fail('should not run to here');
    } catch (ex) {
      assert.strictEqual(ex.message, `get sts token failed with OIDC`);
    }

    // case 6: mock ok value
    (p as any).doRequest = async function () {
      return Response.builder().withStatusCode(200).withBody(Buffer.from(`{"Credentials": {"AccessKeyId":"saki","AccessKeySecret":"saks","Expiration":"2021-10-20T04:27:09Z","SecurityToken":"token"}}`)).build();
    };

    const creds = await (p as any).getCredentialsInternal();

    assert.strictEqual(creds.accessKeyId, 'saki');
    assert.strictEqual(creds.accessKeySecret, 'saks');
    assert.strictEqual(creds.securityToken, 'token');
    assert.strictEqual(creds.expiration, '2021-10-20T04:27:09Z');
  
    // needUpdateCredential
    assert.ok(p.needUpdateCredential() === true);
    (p as any).expirationTimestamp = Date.now() / 1000;
    assert.ok(p.needUpdateCredential() === true);
  
    (p as any).expirationTimestamp = Date.now() / 1000 + 300
    assert.ok(p.needUpdateCredential() === false);
  });

  it('getCredentialsInternal() should ok with request check', async function () {
    const p = OIDCCredentialsProvider.builder()
      .withRoleArn('roleArn')
      .withOIDCProviderArn('oidcProviderArn')
      .withOIDCTokenFilePath(path.join(__dirname, '../fixtures/OIDCToken.txt'))
      .withPolicy('policy')
      .withRoleSessionName('rsn')
      .withStsRegionId('cn-beijing')
      .build();

    (p as any).doRequest = async function (req: Request) {
      assert.strictEqual(req.host, 'sts.cn-beijing.aliyuncs.com');
      assert.strictEqual(req.bodyForm['Policy'] , 'policy');
      assert.strictEqual(req.bodyForm['RoleArn'] , 'roleArn');
      assert.strictEqual(req.bodyForm['RoleSessionName'] , 'rsn');
      assert.strictEqual(req.bodyForm['DurationSeconds'] , '3600');

      throw new Error('mock server error');
    };

    try {
      await p.getCredentials();
      assert.fail('should not run to here');
    } catch (ex) {
      assert.strictEqual(ex.message, `mock server error`);
    }
  });

  it('getCredentials() should ok', async function () {
    const p = OIDCCredentialsProvider.builder()
      .withRoleArn('roleArn')
      .withOIDCProviderArn('oidcProviderArn')
      .withOIDCTokenFilePath(path.join(__dirname, '../fixtures/OIDCToken.txt'))
      .build();

    const expiration = new Date();
    (p as any).doRequest = async function () {
      return Response.builder()
        .withStatusCode(200)
        .withBody(Buffer.from(`{"Credentials": {"AccessKeyId":"akid","AccessKeySecret":"aksecret","Expiration":"${expiration.toISOString()}","SecurityToken":"ststoken"}}`))
        .build();
    };

    let cc = await p.getCredentials()
    assert.strictEqual(cc.accessKeyId, 'akid');
    assert.strictEqual(cc.accessKeySecret, 'aksecret');
    assert.strictEqual(cc.securityToken, 'ststoken')
    assert.strictEqual(cc.providerName, 'oidc_role_arn');
    assert.ok(p.needUpdateCredential() === true);

    // get credentials again
    (p as any).expirationTimestamp = Date.now() / 1000 + 300;
    cc = await p.getCredentials()
    assert.strictEqual(cc.accessKeyId, 'akid');
    assert.strictEqual(cc.accessKeySecret, 'aksecret');
    assert.strictEqual(cc.securityToken, 'ststoken')
    assert.strictEqual(cc.providerName, 'oidc_role_arn');
    assert.ok(p.needUpdateCredential() === false);
  });

  it('getCredentials() with error', async function () {
    const p = OIDCCredentialsProvider.builder()
      .withRoleArn('roleArn')
      .withOIDCProviderArn('oidcProviderArn')
      .withOIDCTokenFilePath(path.join(__dirname, '../fixtures/OIDCToken.txt'))
      .build();

    try {
      await p.getCredentials();
      assert.fail('should not to be here');
    } catch (ex) {
      assert.ok(ex.message.includes(`AuthenticationFail.NoPermission`));
    }
  });

});
