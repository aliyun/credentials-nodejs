'use strict';

const expect = require('expect.js');
const instanceRamRoleCredentialsProvider = require('../lib/provider/instance_ram_role_credentials_provider');
const mm = require('mm');
describe('instanceRamRoleCredentialsProvider with env ALIBABA_CLOUD_ECS_METADATA exists', function () {
  describe('when it is empty', function () {
    before(function () {
      mm(process.env, 'ALIBABA_CLOUD_ECS_METADATA', '');
    });
    after(function () {
      mm.restore();
    });
    it('should return null', async function () {
      expect(instanceRamRoleCredentialsProvider.getCredential()).to.be(null);
    });
  });
  describe('when is not empty', function () {
    before(function () {
      mm(process.env, 'ALIBABA_CLOUD_ECS_METADATA', 'role_name');
    });
    after(function () {
      mm.restore();
    });
    it('should success', async function () {
      instanceRamRoleCredentialsProvider.getCredential();
    });
  });
});
describe('instanceRamRoleCredentialsProvider with no env ALIBABA_CLOUD_ECS_METADATA', function () {
  before(function () {
    delete process.env.ALIBABA_CLOUD_ECS_METADATA;
  });
  after(function () {
    mm.restore();
  });
  it('should return null', async function () {
    let cred = instanceRamRoleCredentialsProvider.getCredential();
    expect(cred).to.be(null);
  });

});

