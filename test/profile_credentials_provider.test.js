'use strict';

const expect = require('expect.js');
const profileCredentialsProvider = require('../lib/provider/profile_credentials_provider');
const mm = require('mm');
const fs = require('fs');
const utils = require('../lib/util/utils');
describe('profileCredentialsProvider with env file_path exists', function () {
  describe('when file_path is empty', function () {
    before(function () {
      mm(process.env, 'ALIBABA_CLOUD_CREDENTIALS_FILE', '');
    });
    after(function () {
      mm.restore();
    });
    it('should failed', async function () {
      expect(function () {
        profileCredentialsProvider.getCredential();
      }).throwError(/Environment variable credentialFile cannot be empty/);
    });
  });
  describe('when file content is empty', function () {
    before(function () {
      mm(process.env, 'ALIBABA_CLOUD_CREDENTIALS_FILE', 'ALIBABA_CLOUD_CREDENTIALS_FILE');
      mm(fs, 'existsSync', function () {
        return false;
      });
    });
    after(function () {
      mm.restore();
    });
    it('should failed', async function () {
      expect(function () {
        profileCredentialsProvider.getCredential();
      }).throwError(/credentialFile ALIBABA_CLOUD_CREDENTIALS_FILE cannot be empty/);
    });
  });
  describe('when type in file is access_key ', function () {
    before(function () {
      mm(process.env, 'ALIBABA_CLOUD_CREDENTIALS_FILE', 'ALIBABA_CLOUD_CREDENTIALS_FILE');
      mm(fs, 'existsSync', function () {
        return true;
      });
      mm(utils, 'parseFile', function () {
        return {
          type: 'access_key',
          accessKeyId: 'accessKeyId',
          accessKeySecret: 'accessKeySecret'
        };
      });
    });
    after(function () {
      mm.restore();
    });
    it('should success', async function () {
      profileCredentialsProvider.getCredential();
    });
  });
  describe('when type in file is bearer ', function () {
    before(function () {
      mm(process.env, 'ALIBABA_CLOUD_CREDENTIALS_FILE', 'ALIBABA_CLOUD_CREDENTIALS_FILE');
      mm(fs, 'existsSync', function () {
        return true;
      });
      mm(utils, 'parseFile', function () {
        return {
          type: 'bearer',
          bearerToken: 'bearerToken',
        };
      });
    });
    after(function () {
      mm.restore();
    });
    it('should success', async function () {
      profileCredentialsProvider.getCredential();
    });
  });
  describe('when type in file is ecs_ram_role ', function () {
    before(function () {
      mm(process.env, 'ALIBABA_CLOUD_CREDENTIALS_FILE', 'ALIBABA_CLOUD_CREDENTIALS_FILE');
      mm(fs, 'existsSync', function () {
        return true;
      });
      mm(utils, 'parseFile', function () {
        return {
          type: 'ecs_ram_role',
          roleName: 'roleName'
        };
      });
    });
    after(function () {
      mm.restore();
    });
    it('should success', async function () {
      profileCredentialsProvider.getCredential();
    });
  });
  describe('when type in file is ram_role_arn ', function () {
    before(function () {
      mm(process.env, 'ALIBABA_CLOUD_CREDENTIALS_FILE', 'ALIBABA_CLOUD_CREDENTIALS_FILE');
      mm(fs, 'existsSync', function () {
        return true;
      });
      mm(utils, 'parseFile', function () {
        return {
          type: 'ram_role_arn',
          roleArn: 'roleArn',
          accessKeyId: 'accessKeyId',
          accessKeySecret: 'accessKeySecret'
        };
      });
    });
    after(function () {
      mm.restore();
    });
    it('should success', async function () {
      profileCredentialsProvider.getCredential();
    });
  });
  describe('when type in file is rsa_key_pair ', function () {
    before(function () {
      mm(process.env, 'ALIBABA_CLOUD_CREDENTIALS_FILE', 'ALIBABA_CLOUD_CREDENTIALS_FILE');
      mm(fs, 'existsSync', function () {
        return true;
      });
      mm(utils, 'parseFile', function () {
        return {
          type: 'rsa_key_pair',
          publicKeyId: 'publicKeyId',
          privateKeyFile: 'privateKeyFile'
        };
      });
    });
    after(function () {
      mm.restore();
    });
    it('should success', async function () {
      profileCredentialsProvider.getCredential();
    });
  });
  describe('when type in file is sts ', function () {
    before(function () {
      mm(process.env, 'ALIBABA_CLOUD_CREDENTIALS_FILE', 'ALIBABA_CLOUD_CREDENTIALS_FILE');
      mm(fs, 'existsSync', function () {
        return true;
      });
      mm(utils, 'parseFile', function () {
        return {
          type: 'sts',
          accessKeyId: 'accessKeyId',
          accessKeySecret: 'accessKeySecret',
          securityToken: 'securityToken'
        };
      });
    });
    after(function () {
      mm.restore();
    });
    it('should success', async function () {
      profileCredentialsProvider.getCredential();
    });
  });
  describe('when type in file is empty ', function () {
    before(function () {
      mm(process.env, 'ALIBABA_CLOUD_CREDENTIALS_FILE', 'ALIBABA_CLOUD_CREDENTIALS_FILE');
      mm(fs, 'existsSync', function () {
        return true;
      });
      mm(utils, 'parseFile', function () {
        return {
          accessKeyId: 'accessKeyId',
          accessKeySecret: 'accessKeySecret',
          securityToken: 'securityToken'
        };
      });
    });
    after(function () {
      mm.restore();
    });
    it('should failed', async function () {
      expect(function () {
        profileCredentialsProvider.getCredential();
      }).throwError(/Missing required type option in credentialFile/);
    });
  });
  describe('when type in file is invalid ', function () {
    before(function () {
      mm(process.env, 'ALIBABA_CLOUD_CREDENTIALS_FILE', 'ALIBABA_CLOUD_CREDENTIALS_FILE');
      mm(fs, 'existsSync', function () {
        return true;
      });
      mm(utils, 'parseFile', function () {
        return {
          type: 'invalid_type',
          accessKeySecret: 'accessKeySecret',
          securityToken: 'securityToken'
        };
      });
    });
    after(function () {
      mm.restore();
    });
    it('should failed', async function () {
      expect(function () {
        profileCredentialsProvider.getCredential();
      }).throwError(/Invalid type option, support: access_key, sts, ecs_ram_role, ram_role_arn, rsa_key_pair/);
    });
  });
});
describe('profileCredentialsProvider with no env file_path', function () {
  describe('when defaultFile exists', function () {
    before(function () {
      delete process.env.ALIBABA_CLOUD_CREDENTIALS_FILE;
      mm(fs, 'existsSync', function () {
        return true;
      });
      mm(utils, 'parseFile', function () {
        return {
          type: 'sts',
          accessKeyId: 'accessKeyId',
          accessKeySecret: 'accessKeySecret',
          securityToken: 'securityToken'
        };
      });
    });
    after(function () {
      mm.restore();
    });
    it('should success', async function () {
      profileCredentialsProvider.getCredential();
    });
  });
  describe('when defaultFile is empty', function () {
    before(function () {
      delete process.env.ALIBABA_CLOUD_CREDENTIALS_FILE;
      mm(fs, 'existsSync', function () {
        return true;
      });
      mm(utils, 'parseFile', function () {
        return null;
      });
    });
    after(function () {
      mm.restore();
    });
    it('should return null', async function () {
      const cred = profileCredentialsProvider.getCredential();
      expect(cred).to.be(null);
    });
  });

});
describe('profileCredentialsProvider with no env file_path and no defaultFile content', function () {
  before(function () {
    delete process.env.ALIBABA_CLOUD_CREDENTIALS_FILE;
    mm(fs, 'existsSync', function () {
      return false;
    });
    mm(utils, 'parseFile', function () {
      return null;
    });
  });
  after(function () {
    mm.restore();
  });
  it('should return null', async function () {
    profileCredentialsProvider.getCredential();
  });

});

