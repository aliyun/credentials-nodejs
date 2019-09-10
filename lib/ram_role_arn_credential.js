'use strict';
const SessionCredential = require('./session_credential');
const httpUtil = require('./util/http');


class RamRoleArnCredential extends SessionCredential {
  constructor(config, runtime) {
    if (!config.access_key_id) {
      throw new Error('Missing required access_key_id option in config for ram_role_arn');
    }
    if (!config.access_key_secret) {
      throw new Error('Missing required access_key_secret option in config for ram_role_arn');
    }
    if (!config.role_arn) {
      throw new Error('Missing required role_arn option in config for ram_role_arn');
    }
    super({
      type: 'ram_role_arn',
      access_key_id: config.access_key_id,
      access_key_secret: config.access_key_secret,
    });
    this.roleArn = config.role_arn;
    this.policy = config.policy || false;
    this.durationSeconds = config.role_session_expiration || 3600;
    this.roleSessionName = config.role_session_name || 'role_session_name';
    this.runtime = runtime || {};
  }

  async updateCredential() {
    let json = await httpUtil.request('https://sts.aliyuncs.com', {
      accessKeyId: this.accessKeyId,
      roleArn: this.roleArn,
      action: 'AssumeRole',
      policy: this.policy,
      durationSeconds: this.durationSeconds,
      roleSessionName: this.roleSessionName,
    }, this.runtime, this.accessKeySecret);
    this.sessionCredential = json.Credentials;
  }
}

module.exports = RamRoleArnCredential;