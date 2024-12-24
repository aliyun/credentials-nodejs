import 'mocha';
import assert from 'assert'

import { Session }from '../../src/providers/session';
import RAMRoleARNCredentialsProvider from '../../src/providers/ram_role_arn';
import StaticAKCredentialsProvider from '../../src/providers/static_ak';
import StaticSTSCredentialsProvider from '../../src/providers/static_sts';
import { Request, Response } from '../../src/providers/http';

describe('RAMRoleARNCredentialsProvider', function () {
  it('should ok to build credentials provider', async function () {
    assert.throws(() => {
      RAMRoleARNCredentialsProvider.builder().build();
    }, (err: Error) => {
      assert.strictEqual('must specify a previous credentials provider to asssume role', err.message);
      return true;
    });
    const provider = StaticAKCredentialsProvider
      .builder()
      .withAccessKeyId('akid')
      .withAccessKeySecret('aksecret')
      .build();

    assert.throws(() => {
      RAMRoleARNCredentialsProvider.builder().withCredentialsProvider(provider).build();
    }, (err: Error) => {
      assert.strictEqual('the RoleArn is empty', err.message);
      return true;
    });

    assert.throws(() => {
      RAMRoleARNCredentialsProvider.builder()
        .withCredentialsProvider(provider)
        .withRoleArn('roleArn')
        .withDurationSeconds(899)
        .build();
    }, (err: Error) => {
      assert.strictEqual('session duration should be in the range of 900s - max session duration', err.message);
      return true;
    });

    let p;
    // test for sts endpoint
    p = RAMRoleARNCredentialsProvider.builder()
      .withCredentialsProvider(provider)
      .withRoleArn('roleArn')
      .build();
    assert.strictEqual('sts.aliyuncs.com', (p as any)['stsEndpoint'])

    p = RAMRoleARNCredentialsProvider.builder()
      .withCredentialsProvider(provider)
      .withRoleArn('roleArn')
      .withStsEndpoint('sts.cn-beijing.aliyuncs.com')
      .build();
    assert.strictEqual('sts.cn-beijing.aliyuncs.com', (p as any)['stsEndpoint'])

    p = RAMRoleARNCredentialsProvider.builder()
      .withCredentialsProvider(provider)
      .withRoleArn('roleArn')
      .withStsRegionId('cn-hangzhou')
      .build();
    assert.strictEqual('sts.cn-hangzhou.aliyuncs.com', (p as any)['stsEndpoint'])

    // test for roleSesssionName
    p = RAMRoleARNCredentialsProvider.builder()
      .withCredentialsProvider(provider)
      .withRoleArn('roleArn')
      .build();
    assert.ok((p as any)['roleSessionName'].startsWith('credentials-nodejs-'))

    p = RAMRoleARNCredentialsProvider.builder()
      .withCredentialsProvider(provider)
      .withRoleArn('roleArn')
      .withRoleSessionName('rsn')
      .build();
    assert.strictEqual('rsn', (p as any)['roleSessionName'])
  });

  it('getCredentialsInternal() should ok', async function () {
    const akProvider = StaticAKCredentialsProvider
      .builder()
      .withAccessKeyId('akid')
      .withAccessKeySecret('aksecret')
      .build();

    let p = RAMRoleARNCredentialsProvider.builder()
      .withCredentialsProvider(akProvider)
      .withRoleArn('roleArn')
      .withRoleSessionName('rsn')
      .withDurationSeconds(1000)
      .build();

    const cc = await akProvider.getCredentials();

    // case 1: server error
    (p as any).doRequest = async function () {
      throw new Error('mock server error');
    };

    try {
      await (p as any).getCredentialsInternal(cc);
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
      await (p as any).getCredentialsInternal(cc);
      assert.fail('should not run to here');
    } catch (ex) {
      assert.strictEqual(ex.message, 'refresh session token failed: 4xx error');
    }

    // case 3: invalid json
    (p as any).doRequest = async function () {
      return Response.builder().withStatusCode(200).withBody(Buffer.from('invalid json')).build();
    };

    try {
      await (p as any).getCredentialsInternal(cc);
      assert.fail('should not run to here');
    } catch (ex) {
      assert.strictEqual(ex.message, `refresh RoleArn sts token err, unmarshal fail: invalid json`);
    }

    // case 4: empty response json
    (p as any).doRequest = async function () {
      return Response.builder().withStatusCode(200).withBody(Buffer.from('null')).build();
    };

    try {
      await (p as any).getCredentialsInternal(cc);
      assert.fail('should not run to here');
    } catch (ex) {
      assert.strictEqual(ex.message, `refresh RoleArn sts token err, fail to get credentials`);
    }

    // case 5: empty session ak response json
    (p as any).doRequest = async function () {
      return Response.builder().withStatusCode(200).withBody(Buffer.from(`{"Credentials": {}}`)).build();
    };

    try {
      await (p as any).getCredentialsInternal(cc);
      assert.fail('should not run to here');
    } catch (ex) {
      assert.strictEqual(ex.message, `refresh RoleArn sts token err, fail to get credentials`);
    }

    // case 6: mock ok value
    (p as any).doRequest = async function () {
      return Response.builder()
        .withStatusCode(200)
        .withBody(Buffer.from(`{"Credentials": {"AccessKeyId":"saki","AccessKeySecret":"saks","Expiration":"2021-10-20T04:27:09Z","SecurityToken":"token"}}`))
        .build();
    };

    const creds = await (p as any).getCredentialsInternal(cc);

    assert.strictEqual(creds.accessKeyId, 'saki');
    assert.strictEqual(creds.accessKeySecret, 'saks');
    assert.strictEqual(creds.securityToken, 'token');
    assert.strictEqual(creds.expiration, '2021-10-20T04:27:09Z');
  
    // needUpdateCredential
    assert.ok(p.needUpdateCredential() === true);
    (p as any).expirationTimestamp = Date.now() / 1000;
    (p as any).refreshTimestamp();
    assert.ok(p.needUpdateCredential() === true);

    (p as any).expirationTimestamp = Date.now() / 1000 + 1000;
    (p as any).refreshTimestamp();
    (p as any).session = new Session(creds.accessKeyId, creds.accessKeySecret, creds.securityToken, creds.expiration);
    assert.ok(p.needUpdateCredential() === false);
  });

  it('getCredentialsInternal() should ok with request check', async function () {
    const stsProvider = StaticSTSCredentialsProvider.builder()
      .withAccessKeyId('akid')
      .withAccessKeySecret('aksecret')
      .withSecurityToken('ststoken')
      .build();

    const p = RAMRoleARNCredentialsProvider.builder()
      .withCredentialsProvider(stsProvider)
      .withRoleArn('roleArn')
      .withRoleSessionName('rsn')
      .withDurationSeconds(1000)
      .withPolicy('policy')
      .withStsRegionId('cn-beijing')
      .withExternalId('externalId')
      .build();

    (p as any).doRequest = async function (req: Request) {
      assert.strictEqual(req.host, 'sts.cn-beijing.aliyuncs.com');
      assert.strictEqual(req.queries['SecurityToken'] , 'ststoken');
      assert.strictEqual(req.bodyForm['Policy'] , 'policy');
      assert.strictEqual(req.bodyForm['RoleArn'] , 'roleArn');
      assert.strictEqual(req.bodyForm['RoleSessionName'] , 'rsn');
      assert.strictEqual(req.bodyForm['DurationSeconds'] , '1000');

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
    const akProvider = StaticAKCredentialsProvider
      .builder()
      .withAccessKeyId('akid')
      .withAccessKeySecret('aksecret')
      .build();

    const p = RAMRoleARNCredentialsProvider.builder()
      .withCredentialsProvider(akProvider)
      .withRoleArn('roleArn')
      .withRoleSessionName('rsn')
      .withDurationSeconds(1000)
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
    assert.strictEqual(cc.providerName, 'ram_role_arn/static_ak');
    (p as any).expirationTimestamp = Date.now() / 1000;
    (p as any).refreshTimestamp();
    assert.ok(p.needUpdateCredential() === true);

    // get credentials again
    (p as any).expirationTimestamp = Date.now() / 1000 + 1000;
    (p as any).refreshTimestamp();
    cc = await p.getCredentials()
    assert.strictEqual(cc.accessKeyId, 'akid');
    assert.strictEqual(cc.accessKeySecret, 'aksecret');
    assert.strictEqual(cc.securityToken, 'ststoken')
    assert.strictEqual(cc.providerName, 'ram_role_arn/static_ak');
    assert.ok(p.needUpdateCredential() === false);
  });

  it('getCredentials() with error', async function () {
    const akProvider = StaticAKCredentialsProvider
      .builder()
      .withAccessKeyId('akid')
      .withAccessKeySecret('aksecret')
      .build();

    const p = RAMRoleARNCredentialsProvider.builder()
      .withCredentialsProvider(akProvider)
      .withRoleArn('roleArn')
      .withRoleSessionName('rsn')
      .withDurationSeconds(1000)
      .build();
    
    try {
      await p.getCredentials();
      assert.fail('should not to be here');
    } catch (ex) {
      assert.ok(ex.message.includes(`InvalidAccessKeyId.NotFound`));
    }
  });

  it('env ALIBABA_CLOUD_ROLE_ARN should ok', async function () {
    const akProvider = StaticAKCredentialsProvider
    .builder()
    .withAccessKeyId('akid')
    .withAccessKeySecret('aksecret')
    .build();
    try {
      RAMRoleARNCredentialsProvider.builder().withCredentialsProvider(akProvider).build();
    } catch (ex) {
      assert.strictEqual(ex.message, 'the RoleArn is empty');
    }
    process.env.ALIBABA_CLOUD_ROLE_ARN = "roleArn";
    let p = RAMRoleARNCredentialsProvider.builder()
    .withCredentialsProvider(akProvider)
    .build();
    assert.strictEqual((p as any).roleArn, "roleArn");
    delete process.env.ALIBABA_CLOUD_ROLE_ARN;
  });

  it('env ALIBABA_CLOUD_ROLE_SESSION_NAME should ok', async function () {
    const akProvider = StaticAKCredentialsProvider
    .builder()
    .withAccessKeyId('akid')
    .withAccessKeySecret('aksecret')
    .build();
    
    let p = RAMRoleARNCredentialsProvider.builder().withRoleArn("roleArn").withCredentialsProvider(akProvider).build();
    assert.ok((p as any).roleSessionName);

    process.env.ALIBABA_CLOUD_ROLE_SESSION_NAME = "sessionName";
    p = RAMRoleARNCredentialsProvider.builder().withRoleArn("roleArn").withCredentialsProvider(akProvider).build();
    assert.strictEqual((p as any).roleSessionName, 'sessionName');
    delete process.env.ALIBABA_CLOUD_ROLE_SESSION_NAME;
  });

  it('env ALIBABA_CLOUD_STS_REGION should ok', async function () {
    const akProvider = StaticAKCredentialsProvider
    .builder()
    .withAccessKeyId('akid')
    .withAccessKeySecret('aksecret')
    .build();
    process.env.ALIBABA_CLOUD_STS_REGION = 'cn-hangzhou';
    let p = RAMRoleARNCredentialsProvider.builder().withRoleArn("roleArn").withCredentialsProvider(akProvider).build();
    assert.strictEqual((p as any).stsEndpoint, 'sts.cn-hangzhou.aliyuncs.com');

    delete process.env.ALIBABA_CLOUD_STS_REGION;
  });

  it('env ALIBABA_CLOUD_VPC_ENDPOINT_ENABLED should ok', async function () {
    const akProvider = StaticAKCredentialsProvider
    .builder()
    .withAccessKeyId('akid')
    .withAccessKeySecret('aksecret')
    .build();
    process.env.ALIBABA_CLOUD_VPC_ENDPOINT_ENABLED = "true";
    let p = RAMRoleARNCredentialsProvider.builder().withRoleArn("roleArn").withCredentialsProvider(akProvider).build();
    assert.strictEqual((p as any).stsEndpoint, 'sts.aliyuncs.com');

    p = RAMRoleARNCredentialsProvider.builder().withRoleArn("roleArn").withCredentialsProvider(akProvider).withStsRegionId("cn-beijing").build();
    assert.strictEqual((p as any).stsEndpoint, 'sts-vpc.cn-beijing.aliyuncs.com');
    delete process.env.ALIBABA_CLOUD_VPC_ENDPOINT_ENABLED;
  });
});
