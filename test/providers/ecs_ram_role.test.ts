import assert from 'assert';
import ECSRAMRoleCredentialsProvider from '../../src/providers/ecs_ram_role';
import { Request, Response } from '../../src/providers/http';
import { Session } from '../../src/providers/session';
import Credentials from '../../src/credentials';

async function sleep(time: number) {
  return new Promise(resolve => setTimeout(resolve, time));
}

describe('ECSRAMRoleCredentialsProvider', function () {
  it('ECSRAMRoleCredentialsProvider', async function () {
    let p = ECSRAMRoleCredentialsProvider.builder().build()
    assert.ok(!(p as any).roleName)
    assert.strictEqual((p as any).disableIMDSv1, false);
    assert.strictEqual((p as any).checker, null);
    p.close();

    p = ECSRAMRoleCredentialsProvider.builder()
      .withRoleName('role')
      .withDisableIMDSv1(false)
      .build()
    assert.strictEqual((p as any).roleName, 'role');
    assert.strictEqual((p as any).disableIMDSv1, false);
    assert.strictEqual((p as any).checker, null);
    p.close();

    p = ECSRAMRoleCredentialsProvider.builder()
      .withRoleName('role')
      .withDisableIMDSv1(true)
      .withAsyncCredentialUpdateEnabled(true)
      .build()
    assert.strictEqual((p as any).roleName, 'role');
    assert.strictEqual((p as any).disableIMDSv1, true);
    assert.ok((p as any).checker);
    assert.ok((p as any).needUpdateCredential());
    p.close();
  });

  it('env ALIBABA_CLOUD_IMDSV1_DISABLED should ok', async function () {
    process.env.ALIBABA_CLOUD_IMDSV1_DISABLED = 'true';
    let p = ECSRAMRoleCredentialsProvider.builder().build()
    assert.strictEqual((p as any).disableIMDSv1, true);
    p.close();
    p = ECSRAMRoleCredentialsProvider.builder().withDisableIMDSv1(true).build()
    assert.strictEqual((p as any).disableIMDSv1, true);
    p.close();
    p = ECSRAMRoleCredentialsProvider.builder().withDisableIMDSv1(false).build()
    assert.strictEqual((p as any).disableIMDSv1, true);
    p.close();
    process.env.ALIBABA_CLOUD_IMDSV1_DISABLED = 'false';
    p = ECSRAMRoleCredentialsProvider.builder().withDisableIMDSv1(false).build()
    assert.strictEqual((p as any).disableIMDSv1, false);
    p.close();
    p = ECSRAMRoleCredentialsProvider.builder().withDisableIMDSv1(true).build()
    assert.strictEqual((p as any).disableIMDSv1, true);
    delete process.env.ALIBABA_CLOUD_IMDSV1_DISABLED;
    p.close();
  });

  it('getRoleName should ok', async function () {
    let p = ECSRAMRoleCredentialsProvider.builder().withDisableIMDSv1(false).build();
    try {
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
    } catch(err) {
      assert.fail('should not run to here');
    } finally{
      p.close();
    }
  });

  it('getRoleName with metadata v2 should ok', async function () {
    let p = ECSRAMRoleCredentialsProvider.builder().withDisableIMDSv1(true).build();
    try{
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
      assert.strictEqual('rolename', roleName);
    }  catch(err) {
      assert.fail('should not run to here');
    } finally{
      p.close();
    }
    
  });

  it('getCredentialsInternal should ok', async function () {
    let p = ECSRAMRoleCredentialsProvider.builder().withDisableIMDSv1(false).build();
    try{
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
        await (p as any).getCredentialsInternal();
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
      (p as any).refreshTimestamp();
      assert.ok((p as any).needUpdateCredential());

      (p as any).expirationTimestamp = Date.now() / 1000 + 1000;
      (p as any).refreshTimestamp();
      (p as any).session = new Session(creds.accessKeyId, creds.accessKeySecret, creds.securityToken, creds.expiration);
      assert.ok(!(p as any).needUpdateCredential());
    } catch(err) {
      assert.fail('should not run to here');
    } finally{
      p.close();
    }
    
  });

  it('getCredentials() with metadata V2 should ok', async function () {
    let p = ECSRAMRoleCredentialsProvider.builder().withRoleName('rolename').withDisableIMDSv1(true).build();
    try {
      // case 1: get metadata token failed
      (p as any).doRequest = async function () {
        throw new Error('mock server error')
      };

      try {
        await (p as any).getCredentialsInternal();
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

      (p as any).expirationTimestamp = Date.now() / 1000;
      (p as any).refreshTimestamp();
      assert.ok((p as any).needUpdateCredential());

      (p as any).expirationTimestamp = Date.now() / 1000 + 1000; 
      (p as any).refreshTimestamp();
      (p as any).session = new Session(creds.accessKeyId, creds.accessKeySecret, creds.securityToken, creds.expiration);
      assert.ok(!(p as any).needUpdateCredential())
    } catch(err) {
      assert.fail('should not run to here');
    } finally{
      p.close();
    }
    
  });

  it('getCredentials() should ok', async function () {
    let p = ECSRAMRoleCredentialsProvider.builder().withRoleName('rolename').build();
    try {
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
      // (p as any).doRequest = async function () {
      //   return Response.builder()
      //     .withStatusCode(200)
      //     .withBody(Buffer.from(`{"AccessKeyId":"saki","AccessKeySecret":"saks","Expiration":"invalidexpiration","SecurityToken":"token","Code":"Success"}`))
      //     .build();
      // }

      // try {
      //   await (p as any).getCredentials();
      //   assert.fail('should not run to here');
      // } catch (ex) {
      //   console.log(ex);
      //   assert.strictEqual(ex.message, 'invalid UTC format time string');
      // }

      // case 2: happy result
      assert.ok((p as any).needUpdateCredential());
      const expiration = new Date(Date.now() + 1000 * 1000);
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
    } catch(err) {
      assert.fail('should not run to here');
    } finally{
      p.close();
    }
    
  });

  it('getMetadataToken() should ok', async function () {
    let p = ECSRAMRoleCredentialsProvider.builder().withDisableIMDSv1(true).build();

    try {
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
      let metadataToken = await (p as any).getMetadataToken();
      assert.strictEqual('tokenxxxxx', metadataToken);

      p.close();

      p = ECSRAMRoleCredentialsProvider.builder().build();

      // case 1: server error
      (p as any).doRequest = async function () {
        throw new Error('mock server error')
      };
      metadataToken = await (p as any).getMetadataToken();
      assert.ok(metadataToken === null);

      // case 2: 4xx
      (p as any).doRequest = async function () {
        return Response.builder()
          .withStatusCode(400)
          .withBody(Buffer.from('xxx'))
          .build();
      };

      metadataToken = await (p as any).getMetadataToken();
      assert.ok(metadataToken === null);

      // case 3: return token
      (p as any).doRequest = async function () {
        return Response.builder().
          withStatusCode(200)
          .withBody(Buffer.from('tokenxxxxx')).build();
      };
      metadataToken = await (p as any).getMetadataToken();
      assert.strictEqual('tokenxxxxx', metadataToken);
    } catch(err) {
      assert.fail('should not run to here');
    } finally{
      p.close();
    }
    
  });

  it('env ALIBABA_CLOUD_ECS_METADATA_DISABLED should ok', async function () {
    try {
      process.env.ALIBABA_CLOUD_ECS_METADATA_DISABLED = "true";
      let p = ECSRAMRoleCredentialsProvider.builder().build();
      p.close();
    } catch (ex) {
      assert.strictEqual(ex.message, 'IMDS credentials is disabled');
    }
    delete process.env.ALIBABA_CLOUD_ECS_METADATA_DISABLED;
  });

  it('prefetch ECS RAM Role should ok', async function () {
    let p = ECSRAMRoleCredentialsProvider.builder().withRoleName('rolename').build();
    try {
      // case 1: happy result
      assert.ok((p as any).needUpdateCredential());
      const expiration = new Date(Date.now() + 6 * 60 * 60 * 1000);
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
      assert.ok(!(p as any).shouldPrefetchCredential());

      // case 2: prefetch a new result
      (p as any).doRequest = async function () {
        return Response.builder()
          .withStatusCode(200)
          .withBody(Buffer.from(`{"AccessKeyId":"akid_new","AccessKeySecret":"aksecret_new","Expiration":"${expiration.toISOString()}","SecurityToken":"token_new","Code":"Success"}`))
          .build();
      };

      (p as any).expirationTimestamp = Date.now() / 1000 + 3600;
      (p as any).refreshTimestamp();
      assert.ok((p as any).shouldPrefetchCredential());

      // get it again
      cc = (await (p as any).getCredentials()) as Credentials;
      assert.strictEqual('akid_new', cc.accessKeyId);
      assert.strictEqual('aksecret_new', cc.accessKeySecret);
      assert.strictEqual('token_new', cc.securityToken);
      assert.ok(!(p as any).shouldPrefetchCredential());
    } catch(err) {
      assert.fail('should not run to here');
    } finally{
      p.close();
    }
  });

  it('deal ECS RAM Role error should ok', async function () {
    let p = ECSRAMRoleCredentialsProvider.builder().withRoleName('rolename').build();
    try {
      // case 1: happy result
      let expiration = new Date(Date.now() + 60 * 60 * 1000);
      assert.ok((p as any).needUpdateCredential());
      assert.ok(!(p as any).shouldRefreshCred);
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
      assert.ok((p as any).shouldPrefetchCredential());
      assert.ok((p as any).shouldRefreshCred);

      // case 2: get a olden time result
      expiration = new Date(Date.now() - 10 * 60 * 1000);
      (p as any).doRequest = async function () {
        return Response.builder()
          .withStatusCode(200)
          .withBody(Buffer.from(`{"AccessKeyId":"akid1","AccessKeySecret":"aksecret1","Expiration":"${expiration.toISOString()}","SecurityToken":"token1","Code":"Success"}`))
          .build();
      };

      cc = (await (p as any).getCredentials()) as Credentials;

      assert.strictEqual('akid', cc.accessKeyId);
      assert.strictEqual('aksecret', cc.accessKeySecret);
      assert.strictEqual('token', cc.securityToken);
      assert.ok(!(p as any).needUpdateCredential());
      assert.ok((p as any).shouldPrefetchCredential());

      // case 3: get a short future time result

      expiration = new Date(Date.now() + 10 * 60 * 1000);
      (p as any).doRequest = async function () {
        return Response.builder()
          .withStatusCode(200)
          .withBody(Buffer.from(`{"AccessKeyId":"akid2","AccessKeySecret":"aksecret2","Expiration":"${expiration.toISOString()}","SecurityToken":"token2","Code":"Success"}`))
          .build();
      };

      cc = (await (p as any).getCredentials()) as Credentials;

      assert.strictEqual('akid2', cc.accessKeyId);
      assert.strictEqual('aksecret2', cc.accessKeySecret);
      assert.strictEqual('token2', cc.securityToken);
      assert.ok((p as any).needUpdateCredential());
      

      // case 4: get a olden time result when old session is also short
      expiration = new Date(Date.now() - 10 * 60 * 1000);
      (p as any).doRequest = async function () {
        return Response.builder()
          .withStatusCode(200)
          .withBody(Buffer.from(`{"AccessKeyId":"akid3","AccessKeySecret":"aksecret3","Expiration":"${expiration.toISOString()}","SecurityToken":"token3","Code":"Success"}`))
          .build();
      };

      cc = (await (p as any).getCredentials()) as Credentials;

      assert.strictEqual('akid3', cc.accessKeyId);
      assert.strictEqual('aksecret3', cc.accessKeySecret);
      assert.strictEqual('token3', cc.securityToken);
      assert.ok(!(p as any).needUpdateCredential());
      assert.ok((p as any).staleTimestamp < (Date.now() / 1000 + 70));

      // case 5: get a olden time result when old session is also short
      (p as any).doRequest = async function () {
        return Response.builder()
          .withStatusCode(200)
          .withBody(Buffer.from(`{"AccessKeyId":"akid4","AccessKeySecret":"aksecret4","Expiration":"InvalidTime","SecurityToken":"token4","Code":"Error"}`))
          .build();
      };

      cc = (await (p as any).getCredentials()) as Credentials;

      assert.strictEqual('akid3', cc.accessKeyId);
      assert.strictEqual('aksecret3', cc.accessKeySecret);
      assert.strictEqual('token3', cc.securityToken);
      assert.ok(!(p as any).needUpdateCredential());
      assert.ok((p as any).staleTimestamp < (Date.now() / 1000 + 70));


      // case 5: get a wrong result when old session is expired
      (p as any).expirationTimestamp = Date.now() / 1000 - 10;
      (p as any).refreshTimestamp();
      (p as any).doRequest = async function () {
        return Response.builder()
          .withStatusCode(400)
          .withBody(Buffer.from(`{"AccessKeyId":"akid4","AccessKeySecret":"aksecret4","Expiration":"InvalidTime","SecurityToken":"token4","Code":"Error"}`))
          .build();
      };

      cc = (await (p as any).getCredentials()) as Credentials;


      assert.strictEqual('akid3', cc.accessKeyId);
      assert.strictEqual('aksecret3', cc.accessKeySecret);
      assert.strictEqual('token3', cc.securityToken);
      assert.ok(!(p as any).needUpdateCredential());
      assert.ok((p as any).staleTimestamp < (Date.now() / 1000 + 10));

      assert.ok((p as any).refreshFaliure > 0);
      
    } catch(err) {
      assert.fail('should not run to here');
    } finally{
      p.close();
    }
  });
});
