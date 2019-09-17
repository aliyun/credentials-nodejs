'use strict';
const AccessKeyCredential = require('../access_key_credential');
const StsTokenCredential = require('../sts_token_credential');
const EcsRamRoleCredential = require('../ecs_ram_role_credential');
const RamRoleArnCredential = require('../ram_role_arn_credential');
const RsaKeyPairCredential = require('../rsa_key_pair_credential');
const BearerTokenCredential = require('../bearer_token_credential');
const utils = require('../util/utils');
const fs = require('fs');
const DEFAULT_PATH = '~/.alibabacloud/credentials';

function getCredential(credentialName = 'default') {
  let fileContent = null;
  const credentialFile = process.env.ALIBABA_CLOUD_CREDENTIALS_FILE;
  if (credentialFile === undefined) {
    if (fs.existsSync(DEFAULT_PATH)) {
      let content = utils.parseFile(DEFAULT_PATH, true);
      if (content) {
        fileContent = content;
      }
    }
  } else {
    if (credentialFile === null || credentialFile === '') {
      throw new Error('Environment variable credentialFile cannot be empty');
    }
    if (!fs.existsSync(credentialFile)) {
      throw new Error(`credentialFile ${credentialFile} cannot be empty`);
    }
    fileContent = utils.parseFile(credentialFile);
  }
  if (fileContent) {
    let config = fileContent[credentialName] || {};
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
        return new RamRoleArnCredential({
          roleArn: config.role_arn,
          accessKeyId: config.access_key_id,
          accessKeySecret: config.access_key_secret
        });
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

module.exports = {
  getCredential
};