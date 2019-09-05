'use strict';
const AccessKeyCredential = require('../accessKeyCredential');
const StsTokenCredential = require('../stsTokenCredential');
const EcsRamRoleCredential = require('../ecsRamRoleCredential');
const RamRoleArnCredential = require('../ramRoleArnCredential');
const RsaKeyPairCredential = require('../rsaKeyPairCredential');
const BearerTokenCredential = require('../bearerTokenCredential');
const utils = require('../util/utils');
const fs = require('fs');
const defaultPath = '~/.alibabacloud/credentials';
class ProfileCredentialsProvider {
  getCredential() {
    let config = null;
    const credentialFile = process.env.ALIBABA_CLOUD_CREDENTIALS_FILE;
    if (credentialFile === undefined) {
      if (fs.existsSync(defaultPath)) {
        let content = utils.parseFile(defaultPath, true);
        if (content) {
          config = content;
        }
      }
    } else {
      if (credentialFile === null || credentialFile === '') {
        throw new Error('Environment variable credentialFile cannot be empty');
      }
      if (!fs.existsSync(credentialFile)) {
        throw new Error(`credentialFile ${credentialFile} cannot be empty`);
      }
      config = utils.parseFile(credentialFile);
    }
    if (config) {
      if (!config.type) {
        throw new Error('Missing required type option in credentialFile');
      }
      switch (config.type) {
        case 'access_key':
          return new AccessKeyCredential(config.access_key_id, config.access_key_secret);
        case 'sts':
          return new StsTokenCredential(config.access_key_id, config.access_key_secret, config.security_token);
        case 'ecs_ram_role':
          return new EcsRamRoleCredential(config.role_name);
        case 'ram_role_arn':
          return new RamRoleArnCredential(config);
        case 'rsa_key_pair':
          return new RsaKeyPairCredential(config.public_key_id, config.private_key_file);
        case 'bearer':
          return new BearerTokenCredential(config.bearer_token);
        default:
          throw new Error('Invalid type option, support: access_key, sts, ecs_ram_role, ram_role_arn, rsa_key_pair');
      }
    }
    return null;
  }
}
module.exports = ProfileCredentialsProvider;