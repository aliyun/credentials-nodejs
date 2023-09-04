import expect from 'expect.js';
import mm from 'mm';
import 'mocha';

import OidcRoleArnCredential from '../src/oidc_role_arn_credential';
import * as utils from '../src/util/utils';
import * as httpUtil from '../src/util/http';
import path from 'path';

import Config from '../src/config';

const defaultConfig: Config = new Config({
  type: 'oidc_role_arn',
  roleArn: 'acs:ram::roleArn:role/roleArn',
  oidcProviderArn: 'acs:ram::roleArn',
  oidcTokenFilePath: path.join(__dirname, '/fixtures/OIDCToken.txt')
});

describe('OidcRoleArnCredential with correct config', function () {
  const cred = new OidcRoleArnCredential(defaultConfig);
  before(function () {
    mm(httpUtil, 'request', function () {
      return {
        RequestId: '76C9056D-0E40-4ED9-A82E-D69B30E733C8',
        Credentials: {
          AccessKeySecret: 'AccessKeySecret',
          AccessKeyId: 'AccessKeyId',
          Expiration: utils.timestamp(new Date(), 1000 * 3600),
          SecurityToken: 'SecurityToken'
        }
      };
    });
  });

  after(function () {
    mm.restore();
  });

  it('should refresh credentials with sessionCredential expired', async function () {
    await cred.updateCredential();
    let secret = await cred.getAccessKeySecret();
    expect(secret).to.be('AccessKeySecret');
    let id = await cred.getAccessKeyId();
    expect(id).to.be('AccessKeyId');

    await cred.updateCredential();
    let credentialModel = await cred.getCredential();
    expect(credentialModel.accessKeyId).to.be('AccessKeyId');
    expect(credentialModel.accessKeySecret).to.be('AccessKeySecret');
  });

  it('should refresh credentials with no sessionCredential', async function () {
    cred.sessionCredential = null;
    let needRefresh = cred.needUpdateCredential();
    expect(needRefresh).to.be(true);
    let secret = await cred.getAccessKeySecret();
    expect(secret).to.be('AccessKeySecret');
    let id = await cred.getAccessKeyId();
    expect(id).to.be('AccessKeyId');

    cred.sessionCredential = null;
    expect(cred.needUpdateCredential()).to.be(true);
    let credentialModel = await cred.getCredential();
    expect(credentialModel.accessKeyId).to.be('AccessKeyId');
    expect(credentialModel.accessKeySecret).to.be('AccessKeySecret');
  });
});

describe('OidcRoleArnCredential should filed with invalid config ', function () {
  it('should failed when config has no roleArn', async function () {
    expect(function () {
      const conf = new Config({
        type: 'oidc_role_arn',
        // roleArn: 'roleArn',
        oidcProviderArn: 'oidcProviderArn',
        oidcTokenFilePath: 'oidcTokenFilePath'
      })
      new OidcRoleArnCredential(conf);
    }).throwException(/roleArn does not exist and env ALIBABA_CLOUD_ROLE_ARN is null./);
  });
  it('should failed when config has no oidcProviderArn', async function () {
    expect(function () {
      const conf = new Config({
        type: 'oidc_role_arn',
        roleArn: 'roleArn',
        // oidcProviderArn: 'oidcProviderArn',
        oidcTokenFilePath: 'oidcTokenFilePath'
      })
      new OidcRoleArnCredential(conf);
    }).throwException(/oidcProviderArn does not exist and env ALIBABA_CLOUD_OIDC_PROVIDER_ARN is null./);
  });
  it('should failed when config has no oidcTokenFilePath', async function () {
    expect(function () {
      const conf = new Config({
        type: 'oidc_role_arn',
        roleArn: 'roleArn',
        oidcProviderArn: 'oidcProviderArn',
        // oidcTokenFilePath: 'oidcTokenFilePath'
      })
      new OidcRoleArnCredential(conf);
    }).throwException(/oidcTokenFilePath is not exists and env ALIBABA_CLOUD_OIDC_TOKEN_FILE is null./);
  });
});
