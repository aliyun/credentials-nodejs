'use strict';
const AccessKeyCredential = require('../access_key_credential');
const StsTokenCredential = require('../sts_token_credential');
const EcsRamRoleCredential = require('../ecs_ram_role_credential');
const RamRoleArnCredential = require('../ram_role_arn_credential');
const RsaKeyPairCredential = require('../rsa_key_pair_credential');
const BearerTokenCredential = require('../bearer_token_credential');
const utils = require('../util/utils');
const fs = require('fs');
const defaultPath = '~/.alibabacloud/credentials';

function getCredential() {
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
        return new AccessKeyCredential(config.accessKeyId, config.accessKeySecret);
      case 'sts':
        return new StsTokenCredential(config.accessKeyId, config.accessKeySecret, config.securityToken);
      case 'ecs_ram_role':
        return new EcsRamRoleCredential(config.roleName);
      case 'ram_role_arn':
        return new RamRoleArnCredential(config);
      case 'rsa_key_pair':
        return new RsaKeyPairCredential(config.publicKeyId, config.privateKeyFile);
      case 'bearer':
        return new BearerTokenCredential(config.bearerToken);
      default:
        throw new Error('Invalid type option, support: access_key, sts, ecs_ram_role, ram_role_arn, rsa_key_pair');
    }
  }
  return null;
}

module.exports = {
  getCredential
};