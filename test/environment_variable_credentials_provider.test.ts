

import expect from 'expect.js';
import environmentVariableCredentialsProvider from '../src/provider/environment_variable_credentials_provider';
import mm from 'mm';
import 'mocha';

describe('environmentVariableCredentialsProvider with env variables', function () {
  before(function () {
    mm(process.env, 'ALIBABA_CLOUD_ACCESS_KEY_ID', 'accessKeyId');
    mm(process.env, 'ALIBABA_CLOUD_ACCESS_KEY_SECRET', 'accessKeySecret');
  });

  after(function () {
    mm.restore();
  });

  it('should success', async function () {
    const cred = environmentVariableCredentialsProvider.getCredential();
    let id = await cred.getAccessKeyId();
    expect(id).to.be('accessKeyId');
    let secret = await cred.getAccessKeySecret();
    expect(secret).to.be('accessKeySecret');
    let type = await cred.getType();
    expect(type).to.be('access_key');
    let credentialModel = await cred.getCredential();
    expect(credentialModel.accessKeyId).to.be('accessKeyId');
    expect(credentialModel.accessKeySecret).to.be('accessKeySecret');
    expect(credentialModel.type).to.be('access_key');
  });
});

describe('environmentVariableCredentialsProvider with no env variables ', function () {
  before(function () {
    delete process.env.ALIBABA_CLOUD_ACCESS_KEY_ID;
    delete process.env.ALIBABA_CLOUD_ACCESS_KEY_SECRET;
  });

  after(function () {
    mm.restore();
  });

  it('should return null', async function () {
    const cred = environmentVariableCredentialsProvider.getCredential();
    expect(cred).to.be(null);
  });
});

describe('environmentVariableCredentialsProvider with empty ALIBABA_CLOUD_ACCESS_KEY_ID ', function () {
  before(function () {
    mm(process.env, 'ALIBABA_CLOUD_ACCESS_KEY_ID', '');
    mm(process.env, 'ALIBABA_CLOUD_ACCESS_KEY_SECRET', 'accessKeySecret');
  });

  after(function () {
    mm.restore();
  });

  it('should failed ', async function () {
    expect(function () {
      environmentVariableCredentialsProvider.getCredential();
    }).throwException(/Environment variable ALIBABA_CLOUD_ACCESS_KEY_ID cannot be empty/);
  });
});

describe('environmentVariableCredentialsProvider with empty ALIBABA_CLOUD_ACCESS_KEY_SECRET ', function () {
  before(function () {
    mm(process.env, 'ALIBABA_CLOUD_ACCESS_KEY_ID', 'accessKeyId');
    mm(process.env, 'ALIBABA_CLOUD_ACCESS_KEY_SECRET', '');
  });

  after(function () {
    mm.restore();
  });

  it('should failed ', async function () {
    expect(function () {
      environmentVariableCredentialsProvider.getCredential();
    }).throwException(/Environment variable ALIBABA_CLOUD_ACCESS_KEY_SECRET cannot be empty/);
  });
});