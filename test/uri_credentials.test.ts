import expect from 'expect.js';
import 'mocha';
import mm from 'mm';
import httpx from 'httpx';

import * as utils from '../src/util/utils';
import URICredential from '../src/uri_credential';
import assert from 'assert';
import { before } from 'mocha';

const mock = (response: any, body: any) => {
  before(function () {
    mm(httpx, 'request', async function () {
      return response;
    });

    mm(httpx, 'read', async function () {
      return body;
    });
  });

  after(function () {
    mm.restore();
  });
};

describe('URICredential should failed with invalid config ', function () {
  it('should failed when config has no credentialsURI', async function () {
    expect(function () {
      new URICredential('');
    }).throwException(/Missing required credentialsURI option in config or environment variable for credentials_uri/);
  });
});

describe('URICredential should get uri from env', function () {
  before(() => {
    process.env.ALIBABA_CLOUD_CREDENTIALS_URI = 'http://localhost:3000/';
  });

  after(() => {
    process.env.ALIBABA_CLOUD_CREDENTIALS_URI = '';
  });

  it('should failed when config has no credentialsURI', function () {
    const credential = new URICredential('');
    assert.strictEqual(credential.credentialsURI, 'http://localhost:3000/');
  });
});

describe('URICredential with 400', function () {
  // defaultConfig.policy = 'policy';
  const cred = new URICredential('http://localhost:3000/');

  mock({ statusCode: 404 }, '');

  it('should failed', async function () {
    try {
      await cred.getAccessKeyId();
    } catch (ex) {
      assert.strictEqual(ex.message, 'Get credentials from http://localhost:3000/ failed, status code is 404');
      return;
    }
  });
});

describe('URICredential with invalid json', function () {
  const cred = new URICredential('http://localhost:3000/');

  mock({ statusCode: 200 }, 'invalid json');

  it('should failed', async function () {
    try {
      await cred.getAccessKeyId();
    } catch (ex) {
      assert.strictEqual(ex.message, 'Get credentials from http://localhost:3000/ failed, unmarshal response failed, JSON is: invalid json');
      return;
    }
  });
});

describe('URICredential with failed response', function () {
  const cred = new URICredential('http://localhost:3000/');

  mock({ statusCode: 200 }, JSON.stringify({
    Code: 'failed'
  }));

  it('should failed', async function () {
    try {
      await cred.getAccessKeyId();
    } catch (ex) {
      assert.strictEqual(ex.message, 'Get credentials from http://localhost:3000/ failed, Code is failed');
      return;
    }
  });
});

describe('URICredential with success response', function () {
  const cred = new URICredential('http://localhost:3000/');

  mock({ statusCode: 200 }, JSON.stringify({
    Code: 'Success',
    AccessKeySecret: 'AccessKeySecret',
    AccessKeyId: 'AccessKeyId',
    Expiration: utils.timestamp(new Date(), 1000 * 3600),
    SecurityToken: 'SecurityToken'
  }));

  it('should success', async function () {
    let id = await cred.getAccessKeyId();
    expect(id).to.be('AccessKeyId');
    let secret = await cred.getAccessKeySecret();
    expect(secret).to.be('AccessKeySecret');
    let token = await cred.getSecurityToken();
    expect(token).to.be('SecurityToken');
    let type = cred.getType();
    expect(type).to.be('credentials_uri');

    let credentialModel = await cred.getCredential();
    expect(credentialModel.accessKeyId).to.be('AccessKeyId');
    expect(credentialModel.accessKeySecret).to.be('AccessKeySecret');
    expect(credentialModel.securityToken).to.be('SecurityToken');
    expect(credentialModel.type).to.be('credentials_uri');

  });

  it('should refresh credentials with sessionCredential expired', async function () {
    cred.sessionCredential.Expiration = utils.timestamp(cred.sessionCredential.Expiration, -1000 * 3600 * 0.96);
    let needRefresh = cred.needUpdateCredential();
    expect(needRefresh).to.be(true);
    let token = await cred.getSecurityToken();
    expect(token).to.be('SecurityToken');

    cred.sessionCredential.Expiration = utils.timestamp(cred.sessionCredential.Expiration, -1000 * 3600 * 0.96);
    expect(cred.needUpdateCredential()).to.be(true);
    let credentialModel = await cred.getCredential();
    expect(credentialModel.securityToken).to.be('SecurityToken');
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
