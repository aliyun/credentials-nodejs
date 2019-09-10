/* eslint-disable indent */
'use strict';

const AccessKeyCredential = require('./access_key_credential');
const StsTokenCredential = require('./sts_token_credential');
const EcsRamRoleCredential = require('./ecs_ram_role_credential');
const RamRoleArnCredential = require('./ram_role_arn_credential');
const RsaKeyPairCredential = require('./rsa_key_pair_credential');
const BearerTokenCredential = require('./bearer_token_credential');
const DefaultProvider = require('./provider/provider_chain');

class Credentials {
  constructor(config, runtime = {}) {
    this.credentials = null;
    this.load(config, runtime);
    return this.credentials;
  }

  load(config, runtime) {
    if (!config) {
      return this.credentials = DefaultProvider.getCredentials();
    }
    if (!config.type) {
      throw new Error('Missing required type option');
    }
    switch (config.type) {
      case 'access_key':
        this.credentials = new AccessKeyCredential(config.access_key_id, config.access_key_secret);
        break;
      case 'sts':
        this.credentials = new StsTokenCredential(config.access_key_id, config.access_key_secret, config.security_token);
        break;
      case 'ecs_ram_role':
        this.credentials = new EcsRamRoleCredential(config.role_name);
        break;
      case 'ram_role_arn':
        this.credentials = new RamRoleArnCredential(config, runtime);
        break;
      case 'rsa_key_pair':
        this.credentials = new RsaKeyPairCredential(config.public_key_id, config.private_key_file);
        break;
      case 'bearer':
        this.credentials = new BearerTokenCredential(config.bearer_token);
        break;
      default:
        throw new Error('Invalid type option, support: access_key, sts, ecs_ram_role, ram_role_arn, rsa_key_pair');
    }
    return this.credentials;
  }

}

module.exports = Credentials;