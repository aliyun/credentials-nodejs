import assert from 'assert';
import ECSRAMRoleCredentialsProvider from '../../src/providers/ecs_ram_role';
import { Request, Response } from '../../src/providers/http';
import Session from '../../src/providers/session';
import Credentials from '../../src/credentials';

describe('ECSRAMRoleCredentialsProvider', function () {
  it('ECSRAMRoleCredentialsProvider', async function () {
    let p = ECSRAMRoleCredentialsProvider.builder().build()
    assert.ok(!(p as any).roleName)
    assert.strictEqual((p as any).enableIMDSv2, true);

    p = ECSRAMRoleCredentialsProvider.builder()
      .withRoleName('role')
      .withEnableIMDSv2(false)
      .build()
    assert.strictEqual((p as any).roleName, 'role');
    assert.strictEqual((p as any).enableIMDSv2, false);

    assert.ok((p as any).needUpdateCredential());
  });

  it('env ALIBABA_CLOUD_IMDSV2_DISABLED should ok', async function () {
    process.env.ALIBABA_CLOUD_IMDSV2_DISABLED = 'true';
    let p = ECSRAMRoleCredentialsProvider.builder().build()
    assert.strictEqual((p as any).enableIMDSv2, false);
    p = ECSRAMRoleCredentialsProvider.builder().withEnableIMDSv2(true).build()
    assert.strictEqual((p as any).enableIMDSv2, false);
    p = ECSRAMRoleCredentialsProvider.builder().withEnableIMDSv2(false).build()
    assert.strictEqual((p as any).enableIMDSv2, false);
    delete process.env.ALIBABA_CLOUD_IMDSV2_DISABLED;
  });

  it('getRoleName should ok', async function () {
    let p = ECSRAMRoleCredentialsProvider.builder().withEnableIMDSv2(false).build();
    // case 1: server error
    (p as any).doRequest = async function () {
      throw new Error('mock server error')
    }

    try {
      await (p as any).getRoleName();
      assert.fail('should not run to here');
    } catch (ex) {
      assert.strictEqual(ex.message, 'mock server error');
    }

    // case 2: 4xx error
    (p as any).doRequest = async function () {
      return Response.builder().withStatusCode(400).withBody(Buffer.from('4xx error')).build();
    };

    try {
      await (p as any).getRoleName();
      assert.fail('should not run to here');
    } catch (ex) {
      assert.strictEqual(ex.message, 'get role name failed: GET http://100.100.100.200/latest/meta-data/ram/security-credentials/ 400');
    }

    // case 3: ok
    (p as any).doRequest = async function () {
      return Response.builder().
        withStatusCode(200)
        .withBody(Buffer.from('rolename'))
    }
    const roleName = await (p as any).getRoleName()

    assert.strictEqual('rolename', roleName)
  });

  it('getRoleName with metadata v2 should ok', async function () {
    let p = ECSRAMRoleCredentialsProvider.builder().withEnableIMDSv2(true).build();

    // case 1: get metadata token failed
    (p as any).doRequest = async function () {
      throw new Error('mock server error')
    };

    try {
      await (p as any).getRoleName();
      assert.fail('should not run to here');
    } catch (ex) {
      assert.strictEqual(ex.message, 'mock server error');
    }

    // case 2: return token
    (p as any).doRequest = async function (request: Request) {
      if (request.path == '/latest/api/token') {
        return Response.builder().withStatusCode(200).withBody(Buffer.from('tokenxxxxx')).build();
      } else {
        assert.strictEqual(request.headers['x-aliyun-ecs-metadata-token'], 'tokenxxxxx')
        return Response.builder().withStatusCode(200).withBody(Buffer.from('rolename')).build();
      }
    }

    let roleName = await (p as any).getRoleName();
    assert.strictEqual('rolename', roleName)
  });

  it('getCredentialsInternal should ok', async function () {
    let p = ECSRAMRoleCredentialsProvider.builder().withEnableIMDSv2(false).build();

    // case 1: server error
    (p as any).doRequest = async function () {
      throw new Error('mock server error')
    };

    try {
      await (p as any).getCredentialsInternal();
      assert.fail('should not run to here');
    } catch (ex) {
      assert.strictEqual(ex.message, 'mock server error');
    }

    // case 2: get role name ok, get credentials failed with server error
    (p as any).doRequest = async function (req: Request) {
      if (req.path === '/latest/meta-data/ram/security-credentials/') {
        return Response.builder()
          .withStatusCode(200)
          .withBody(Buffer.from('rolename'))
          .build();
      }

      throw new Error('mock server error')
    }

    try {
      await (p as any).getCredentialsInternal();
      assert.fail('should not run to here');
    } catch (ex) {
      assert.strictEqual('mock server error', ex.message)
    }

    // case 3: 4xx error
    (p as any).doRequest = async function (req: Request) {
      if (req.path == '/latest/meta-data/ram/security-credentials/') {
        return Response.builder().withStatusCode(200).withBody(Buffer.from('rolename')).build();
      }
      return Response.builder().withStatusCode(400).withBody(Buffer.from('4xx error')).build();
    };

    try {
      await (p as any).getCredentialsInternal();
      assert.fail('should not run to here');
    } catch (ex) {
      assert.strictEqual(ex.message, 'get sts token failed, httpStatus: 400, message = 4xx error');
    }

    // case 4: invalid json
    (p as any).doRequest = async function (request: Request) {
      if (request.path === '/latest/meta-data/ram/security-credentials/') {
        return Response.builder().withStatusCode(200)
          .withBody(Buffer.from('rolename'))
      }

      return Response.builder()
        .withStatusCode(200)
        .withBody(Buffer.from('invalid json'))
        .build();
    };

    try {
      await (p as any).getCredentialsInternal();
      assert.fail('should not run to here');
    } catch (ex) {
      assert.ok(ex.message.startsWith(`get sts token failed, json parse failed:`));
    }

    // case 5: empty response json
    (p as any).doRequest = async function (request: Request) {
      if (request.path === '/latest/meta-data/ram/security-credentials/') {
        return Response.builder()
          .withStatusCode(200)
          .withBody(Buffer.from('rolename'))
          .build();
      }

      return Response.builder()
        .withStatusCode(200)
        .withBody(Buffer.from('null'))
        .build();
    };

    try {
      await (p as any).getCredentialsInternal();
      assert.fail('should not run to here');
    } catch (ex) {
      assert.strictEqual(ex.message, 'get sts token failed');
    }

    // case 6: empty session ak response json
    (p as any).doRequest = async function (request: Request) {
      if (request.path === '/latest/meta-data/ram/security-credentials/') {
        return Response.builder()
          .withStatusCode(200)
          .withBody(Buffer.from('rolename'))
          .build();
      }

      return Response.builder()
        .withStatusCode(200)
        .withBody(Buffer.from('{}'))
        .build();
    };

    try {
      await  (p as any).getCredentialsInternal();
      assert.fail('should not run to here');
    } catch (ex) {
      assert.strictEqual(ex.message, 'get sts token failed');
    }

    // case 7: non-success response
    (p as any).doRequest = async function (request: Request) {
      if (request.path === '/latest/meta-data/ram/security-credentials/') {
        return Response.builder().withStatusCode(200)
          .withBody(Buffer.from('rolename'))
      }

      return Response.builder().
        withStatusCode(200)
        .withBody(Buffer.from(`{"AccessKeyId":"saki","AccessKeySecret":"saks","Expiration":"2021-10-20T04:27:09Z","SecurityToken":"token","Code":"Failed"}`)).build();
    };
    
    try {
      await (p as any).getCredentialsInternal();
      assert.fail('should not run to here');
    } catch (ex) {
      assert.strictEqual(ex.message, 'refresh Ecs sts token err, Code is not Success');
    }

    // case 8: mock ok value
    (p as any).doRequest = async function (request: Request) {
      if (request.path === '/latest/meta-data/ram/security-credentials/') {
        return Response.builder().withStatusCode(200)
          .withBody(Buffer.from('rolename'))
          .build();
      }

      return Response.builder().
        withStatusCode(200)
        .withBody(Buffer.from(`{"AccessKeyId":"saki","AccessKeySecret":"saks","Expiration":"2021-10-20T04:27:09Z","SecurityToken":"token","Code":"Success"}`))
        .build();
    };

    const creds = await (p as any).getCredentialsInternal();

    assert.strictEqual('saki', creds.accessKeyId)
    assert.strictEqual('saks', creds.accessKeySecret)
    assert.strictEqual('token', creds.securityToken)
    assert.strictEqual('2021-10-20T04:27:09Z', creds.expiration);

    // needUpdateCredential
    assert.ok((p as any).needUpdateCredential());
    (p as any).expirationTimestamp = Date.now() / 1000;
    assert.ok((p as any).needUpdateCredential());

    (p as any).expirationTimestamp = Date.now() / 1000 + 300;
    assert.ok(!(p as any).needUpdateCredential())
  });

  it('getCredentials() with metadata V2 should ok', async function () {
    let p = ECSRAMRoleCredentialsProvider.builder().withRoleName('rolename').withEnableIMDSv2(true).build();
    // case 1: get metadata token failed
    (p as any).doRequest = async function () {
      throw new Error('mock server error')
    };

    try {
      await  (p as any).getCredentialsInternal();
      assert.fail('should not run to here');
    } catch (ex) {
      assert.strictEqual(ex.message, 'mock server error');
    }

    // case 2: return token
    (p as any).doRequest = async function (request: Request) {
      if (request.path === '/latest/api/token') {
        return Response.builder()
          .withStatusCode(200)
          .withBody(Buffer.from('tokenxxxxx'))
          .build()
      } else if (request.path === '/latest/meta-data/ram/security-credentials/rolename') {
        assert.strictEqual('tokenxxxxx', request.headers['x-aliyun-ecs-metadata-token'])
        return Response.builder()
          .withStatusCode(200)
          .withBody(Buffer.from(`{"AccessKeyId":"saki","AccessKeySecret":"saks","Expiration":"2021-10-20T04:27:09Z","SecurityToken":"token","Code":"Success"}`))
          .build();
      }
    }

    let creds = await (p as any).getCredentialsInternal() as Session;

    assert.strictEqual('saki', creds.accessKeyId)
    assert.strictEqual('saks', creds.accessKeySecret)
    assert.strictEqual('token', creds.securityToken)
    assert.strictEqual('2021-10-20T04:27:09Z', creds.expiration)

    // needUpdateCredential
    assert.ok((p as any).needUpdateCredential());
    (p as any).expirationTimestamp = Date.now() / 1000
    assert.ok((p as any).needUpdateCredential());

    (p as any).expirationTimestamp = Date.now() / 1000 + 300;
    assert.ok(!(p as any).needUpdateCredential())
  });

  it('getCredentials() should ok', async function () {
    let p = ECSRAMRoleCredentialsProvider.builder().withRoleName('rolename').build();

    // case 1: get credentials failed
    (p as any).doRequest = async function () {
      throw new Error('mock server error')
    }

    try {
      await (p as any).getCredentials();
      assert.fail('should not run to here');
    } catch (ex) {
      assert.strictEqual(ex.message, 'mock server error');
    }

    // case 2: get invalid expiration
    (p as any).doRequest = async function () {
      return Response.builder()
        .withStatusCode(200)
        .withBody(Buffer.from(`{"AccessKeyId":"saki","AccessKeySecret":"saks","Expiration":"invalidexpiration","SecurityToken":"token","Code":"Success"}`))
        .build();
    }

    try {
      await (p as any).getCredentials();
      assert.fail('should not run to here');
    } catch (ex) {
      assert.strictEqual(ex.message, 'invalid UTC format time string');
    }

    // case 3: happy result
    assert.ok((p as any).needUpdateCredential());
    const expiration = new Date(Date.now() + 300000);
    (p as any).doRequest = async function () {
      return Response.builder()
        .withStatusCode(200)
        .withBody(Buffer.from(`{"AccessKeyId":"akid","AccessKeySecret":"aksecret","Expiration":"${expiration.toISOString()}","SecurityToken":"token","Code":"Success"}`))
        .build();
    }
    let cc = (await (p as any).getCredentials()) as Credentials;
    assert.strictEqual('akid', cc.accessKeyId);
    assert.strictEqual('aksecret', cc.accessKeySecret);
    assert.strictEqual('token', cc.securityToken);
    assert.ok(!(p as any).needUpdateCredential());

    // get it again
    cc = (await (p as any).getCredentials()) as Credentials;
    assert.strictEqual('akid', cc.accessKeyId);
    assert.strictEqual('aksecret', cc.accessKeySecret);
    assert.strictEqual('token', cc.securityToken);
    assert.ok(!(p as any).needUpdateCredential());
  });

  it('getMetadataToken() should ok', async function () {
    let p = ECSRAMRoleCredentialsProvider.builder().build();

    // case 1: server error
    (p as any).doRequest = async function () {
      throw new Error('mock server error')
    };

    try {
      await (p as any).getMetadataToken();
      assert.fail('should not run to here');
    } catch (ex) {
      assert.strictEqual(ex.message, 'mock server error');
    }

    // case 2: 4xx
    (p as any).doRequest = async function () {
      return Response.builder()
        .withStatusCode(400)
        .withBody(Buffer.from('xxx'))
        .build();
    };
  
    try {
      await (p as any).getMetadataToken();
      assert.fail('should not run to here');
    } catch (ex) {
      assert.strictEqual(ex.message, 'get metadata token failed with 400');
    }

    // case 3: return token
    (p as any).doRequest = async function () {
      return Response.builder().
        withStatusCode(200)
        .withBody(Buffer.from('tokenxxxxx')).build();
    };
    const metadataToken = await (p as any).getMetadataToken()
    assert.strictEqual('tokenxxxxx', metadataToken)
  });
});
