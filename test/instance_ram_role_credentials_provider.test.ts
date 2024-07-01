

import expect from 'expect.js';
import instanceRamRoleCredentialsProvider from '../src/provider/instance_ram_role_credentials_provider';
import mm from 'mm';
import 'mocha';

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
      mm(process.env, 'ALIBABA_CLOUD_ECS_METADATA', 'roleName');
    });

    after(function () {
      mm.restore();
    });

    it('should success', async function () {
      instanceRamRoleCredentialsProvider.getCredential();
    });
  });

  describe('when ALIBABA_CLOUD_IMDSV1_DISABLE is true', function () {
    before(function () {
      mm(process.env, 'ALIBABA_CLOUD_ECS_METADATA', 'roleName');
      mm(process.env, 'ALIBABA_CLOUD_IMDSV1_DISABLE', 'true');
    });

    after(function () {
      mm.restore();
    });

    it('should success', async function () {
      instanceRamRoleCredentialsProvider.getCredential();
    });
  });

  describe('when ALIBABA_CLOUD_IMDSV1_DISABLE is false', function () {
    before(function () {
      mm(process.env, 'ALIBABA_CLOUD_ECS_METADATA', 'roleName');
      mm(process.env, 'ALIBABA_CLOUD_IMDSV1_DISABLE', 'false');
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
