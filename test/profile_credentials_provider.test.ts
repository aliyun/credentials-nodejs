

import expect from 'expect.js';
import profileCredentialsProvider from '../src/provider/profile_credentials_provider';
import mm from 'mm';
import fs from 'fs';
import * as utils from '../src/util/utils';
import path from 'path';
import 'mocha';

const ENV_CREDENTIALS_FILE = path.join(__dirname, '/fixtures/credentials');

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

  describe('when env credential file exist', function () {
    before(function () {
      mm(process.env, 'ALIBABA_CLOUD_CREDENTIALS_FILE', ENV_CREDENTIALS_FILE);
    });

    after(function () {
      mm.restore();
    });

    it('should success with no credential_name', async function () {
      let cred = profileCredentialsProvider.getCredential();
      expect(cred.getType()).to.be('access_key');
    });

    it('should success with valid credential_name', async function () {
      let cred = profileCredentialsProvider.getCredential('demo');
      expect(cred.getType()).to.be('ram_role_arn');
    });

    it('should failed with invalid credential_name', async function () {
      expect(function () {
        profileCredentialsProvider.getCredential('invalid');
      }).throwException(/Missing required type option in credentialFile/);
    });
  });

  describe('when default type in file is access_key ', function () {
    before(function () {
      mm(process.env, 'ALIBABA_CLOUD_CREDENTIALS_FILE', 'ALIBABA_CLOUD_CREDENTIALS_FILE');

      mm(fs, 'existsSync', function () {
        return true;
      });

      mm(utils, 'parseFile', function () {
        return {
          default: {
            type: 'access_key',
            access_key_id: 'access_key_id',
            access_key_secret: 'access_key_secret'
          }
        };
      });
    });
    after(function () {
      mm.restore();
    });
    it('should success', async function () {
      let cred = profileCredentialsProvider.getCredential();
      expect(cred.getType()).to.be('access_key');
    });
  });

  describe('when default type in file is bearer ', function () {
    before(function () {
      mm(process.env, 'ALIBABA_CLOUD_CREDENTIALS_FILE', 'ALIBABA_CLOUD_CREDENTIALS_FILE');
      mm(fs, 'existsSync', function () {
        return true;
      });
      mm(utils, 'parseFile', function () {
        return {
          default: {
            type: 'bearer',
            bearer_token: 'bearerToken',
          }
        };
      });
    });
    after(function () {
      mm.restore();
    });
    it('should success', async function () {
      let cred = profileCredentialsProvider.getCredential();
      expect(cred.getType()).to.be('bearer');
    });
  });
  describe('when default type in file is ecs_ram_role ', function () {
    before(function () {
      mm(process.env, 'ALIBABA_CLOUD_CREDENTIALS_FILE', 'ALIBABA_CLOUD_CREDENTIALS_FILE');
      mm(fs, 'existsSync', function () {
        return true;
      });
      mm(utils, 'parseFile', function () {
        return {
          default: {
            type: 'ecs_ram_role',
            role_name: 'roleName'
          }
        };
      });
    });
    after(function () {
      mm.restore();
    });
    it('should success', async function () {
      let cred = profileCredentialsProvider.getCredential();
      expect(cred.getType()).to.be('ecs_ram_role');
    });
  });
  describe('when default type in file is ram_role_arn ', function () {
    before(function () {
      mm(process.env, 'ALIBABA_CLOUD_CREDENTIALS_FILE', 'ALIBABA_CLOUD_CREDENTIALS_FILE');
      mm(fs, 'existsSync', function () {
        return true;
      });
      mm(utils, 'parseFile', function () {
        return {
          default: {
            type: 'ram_role_arn',
            role_arn: 'role_arn',
            access_key_id: 'access_key_id',
            access_key_secret: 'access_key_secret'
          }
        };
      });
    });
    after(function () {
      mm.restore();
    });
    it('should success', async function () {
      let cred = profileCredentialsProvider.getCredential();
      expect(cred.getType()).to.be('ram_role_arn');
    });
  });
  describe('when default type in file is rsa_key_pair ', function () {
    before(function () {
      mm(process.env, 'ALIBABA_CLOUD_CREDENTIALS_FILE', 'ALIBABA_CLOUD_CREDENTIALS_FILE');
      mm(fs, 'existsSync', function () {
        return true;
      });
      mm(utils, 'parseFile', function () {
        return {
          default: {
            type: 'rsa_key_pair',
            public_key_id: 'public_key_id',
            private_key_file: 'private_key_file'
          }
        };
      });
    });
    after(function () {
      mm.restore();
    });
    it('should success', async function () {
      let cred = profileCredentialsProvider.getCredential();
      expect(cred.getType()).to.be('rsa_key_pair');
    });
  });
  describe('when default type in file is sts ', function () {
    before(function () {
      mm(process.env, 'ALIBABA_CLOUD_CREDENTIALS_FILE', 'ALIBABA_CLOUD_CREDENTIALS_FILE');
      mm(fs, 'existsSync', function () {
        return true;
      });
      mm(utils, 'parseFile', function () {
        return {
          default: {
            type: 'sts',
            access_key_id: 'access_key_id',
            access_key_secret: 'access_key_secret',
            security_token: 'security_token'
          }
        };
      });
    });
    after(function () {
      mm.restore();
    });
    it('should success', async function () {
      let cred = profileCredentialsProvider.getCredential();
      expect(cred.getType()).to.be('sts');
    });
  });
  describe('when default type in file is empty ', function () {
    before(function () {
      mm(process.env, 'ALIBABA_CLOUD_CREDENTIALS_FILE', 'ALIBABA_CLOUD_CREDENTIALS_FILE');
      mm(fs, 'existsSync', function () {
        return true;
      });
      mm(utils, 'parseFile', function () {
        return {
          default: {
            access_key_id: 'access_key_id',
            access_key_secret: 'access_key_secret',
            security_token: 'security_token'
          }
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
  describe('when default type in file is invalid ', function () {
    before(function () {
      mm(process.env, 'ALIBABA_CLOUD_CREDENTIALS_FILE', 'ALIBABA_CLOUD_CREDENTIALS_FILE');
      mm(fs, 'existsSync', function () {
        return true;
      });
      mm(utils, 'parseFile', function () {
        return {
          default: {
            type: 'invalid_type',
            access_key_secret: 'access_key_secret',
            security_token: 'security_token'
          }
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
          default: {
            type: 'sts',
            access_key_id: 'access_key_id',
            access_key_secret: 'access_key_secret',
            security_token: 'security_token'
          }
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
    const credential = profileCredentialsProvider.getCredential();
    expect(credential).to.be.null;
  });

});

