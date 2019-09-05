'use strict';

const expect = require('expect.js');
const ProfileCredentialsProvider = require('../lib/provider/profileCredentialsProvider');
const mm = require('mm');
const fs = require('fs');
const utils = require('../lib/util/utils');
describe('ProfileCredentialsProvider with env file_path exists', function () {
  describe('when file_path is empty', function () {
    before(function () {
      mm(process.env, 'ALIBABA_CLOUD_CREDENTIALS_FILE', '');
    });
    after(function () {
      mm.restore();
    });
    it('should faild', async function () {
      expect(function () {
        new ProfileCredentialsProvider().getCredential();
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
    it('should faild', async function () {
      expect(function () {
        new ProfileCredentialsProvider().getCredential();
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
          access_key_id: 'access_key_id',
          access_key_secret: 'access_key_secret'
        };
      });
    });
    after(function () {
      mm.restore();
    });
    it('should success', async function () {
      new ProfileCredentialsProvider().getCredential();
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
          bearer_token: 'bearer_token',
        };
      });
    });
    after(function () {
      mm.restore();
    });
    it('should success', async function () {
      new ProfileCredentialsProvider().getCredential();
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
          role_name: 'role_name'
        };
      });
    });
    after(function () {
      mm.restore();
    });
    it('should success', async function () {
      new ProfileCredentialsProvider().getCredential();
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
          role_arn: 'role_arn',
          access_key_id: 'access_key_id',
          access_key_secret: 'access_key_secret'
        };
      });
    });
    after(function () {
      mm.restore();
    });
    it('should success', async function () {
      new ProfileCredentialsProvider().getCredential();
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
          public_key_id: 'public_key_id',
          private_key_file: 'private_key_file'
        };
      });
    });
    after(function () {
      mm.restore();
    });
    it('should success', async function () {
      new ProfileCredentialsProvider().getCredential();
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
          access_key_id: 'access_key_id',
          access_key_secret: 'access_key_secret',
          security_token: 'security_token'
        };
      });
    });
    after(function () {
      mm.restore();
    });
    it('should success', async function () {
      new ProfileCredentialsProvider().getCredential();
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
          access_key_id: 'access_key_id',
          access_key_secret: 'access_key_secret',
          security_token: 'security_token'
        };
      });
    });
    after(function () {
      mm.restore();
    });
    it('should faild', async function () {
      expect(function () {
        new ProfileCredentialsProvider().getCredential();
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
          access_key_secret: 'access_key_secret',
          security_token: 'security_token'
        };
      });
    });
    after(function () {
      mm.restore();
    });
    it('should faild', async function () {
      expect(function () {
        new ProfileCredentialsProvider().getCredential();
      }).throwError(/Invalid type option, support: access_key, sts, ecs_ram_role, ram_role_arn, rsa_key_pair/);
    });
  });
});
describe('ProfileCredentialsProvider with no env file_path', function () {
  describe('when defaultFile exists', function () {
    before(function () {
      delete process.env.ALIBABA_CLOUD_CREDENTIALS_FILE;
      mm(fs, 'existsSync', function () {
        return true;
      });
      mm(utils, 'parseFile', function () {
        return {
          type: 'sts',
          access_key_id: 'access_key_id',
          access_key_secret: 'access_key_secret',
          security_token: 'security_token'
        };
      });
    });
    after(function () {
      mm.restore();
    });
    it('should success', async function () {
      new ProfileCredentialsProvider().getCredential();
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
      const cred = new ProfileCredentialsProvider().getCredential();
      expect(cred).to.be(null);
    });
  });

});
describe('ProfileCredentialsProvider with no env file_path and no defaultFile content', function () {
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
    new ProfileCredentialsProvider().getCredential();
  });

});

