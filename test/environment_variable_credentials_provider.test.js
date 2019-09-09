'use strict';

const expect = require('expect.js');
const EnvironmentVariableCredentialsProvider = require('../lib/provider/environment_variable_credentials_provider');
const mm = require('mm');
describe('EnvironmentVariableCredentialsProvider with env variables', function () {
  before(function () {
    mm(process.env, 'ALIBABA_CLOUD_ACCESS_KEY_ID', 'access_key_id');
    mm(process.env, 'ALIBABA_CLOUD_ACCESS_KEY_SECRET', 'access_key_secret');
  });
  after(function () {
    mm.restore();
  });

  it('should success', async function () {
    const cred = new EnvironmentVariableCredentialsProvider().getCredential();
    let id = await cred.getAccessKeyId();
    expect(id).to.be('access_key_id');
    let secret = await cred.getAccessKeySecret();
    expect(secret).to.be('access_key_secret');
    let type = await cred.getType();
    expect(type).to.be('access_key');
  });
});
describe('EnvironmentVariableCredentialsProvider with no env variables ', function () {
  before(function () {
    delete process.env.ALIBABA_CLOUD_ACCESS_KEY_ID;
    delete process.env.ALIBABA_CLOUD_ACCESS_KEY_SECRET;
  });
  after(function () {
    mm.restore();
  });
  it('should return null', async function () {
    const cred = new EnvironmentVariableCredentialsProvider().getCredential();
    expect(cred).to.be(null);
  });
});
describe('EnvironmentVariableCredentialsProvider with empty ALIBABA_CLOUD_ACCESS_KEY_ID ', function () {
  before(function () {
    mm(process.env, 'ALIBABA_CLOUD_ACCESS_KEY_ID', '');
    mm(process.env, 'ALIBABA_CLOUD_ACCESS_KEY_SECRET', 'access_key_secret');
  });
  after(function () {
    mm.restore();
  });

  it('should faild ', async function () {
    let error = '';
    try {
      await new EnvironmentVariableCredentialsProvider().getCredential();
    } catch (e) {
      error = e.message;
    }
    expect(error).to.be('Environment variable ALIBABA_CLOUD_ACCESS_KEY_ID cannot be empty');
  });
});
describe('EnvironmentVariableCredentialsProvider with empty ALIBABA_CLOUD_ACCESS_KEY_SECRET ', function () {
  before(function () {
    mm(process.env, 'ALIBABA_CLOUD_ACCESS_KEY_ID', 'access_key_id');
    mm(process.env, 'ALIBABA_CLOUD_ACCESS_KEY_SECRET', '');
  });
  after(function () {
    mm.restore();
  });

  it('should faild ', async function () {
    let error = '';
    try {
      await new EnvironmentVariableCredentialsProvider().getCredential();
    } catch (e) {
      error = e.message;
    }
    expect(error).to.be('Environment variable ALIBABA_CLOUD_ACCESS_KEY_SECRET cannot be empty');
  });
});