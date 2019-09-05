'use strict';
const defaultCredential = require('./defaultCredential');
const http = require('./util/http');
const utils = require('./util/utils');


class RamRoleArnCredential extends defaultCredential {
  constructor(config, runtime) {
    super({
      type: 'ram_role_arn',
      access_key_id: config.access_key_id,
      access_key_secret: config.access_key_secret,
      role_arn: config.role_arn
    });
    this.roleArn = config.role_arn;
    this.policy = config.policy || false;
    this.durationSeconds = config.role_session_expiration || 3600;
    this.roleSessionName = config.role_session_name || 'role_session_name';
    this.runtime = runtime || {};
    this.sessionCredential = null;
  }
  async getAccessKeyId() {
    if (!this.sessionCredential || this.needUpdateCredential()) {
      await this.updateCredential();
    }
    return this.sessionCredential.AccessKeyId;
  }
  async getAccessKeySecret() {
    if (!this.sessionCredential || this.needUpdateCredential()) {
      await this.updateCredential();
    }
    return this.sessionCredential.AccessKeySecret;
  }
  async getSecurityToken() {
    if (!this.sessionCredential || this.needUpdateCredential()) {
      await this.updateCredential();
    }
    return this.sessionCredential.SecurityToken;
  }
  async updateCredential() {
    let json = await http.request('https://sts.aliyuncs.com', {
      accessKeyId: this.accessKeyId,
      roleArn: this.roleArn,
      action: 'AssumeRole',
      policy: this.policy,
      DurationSeconds: this.durationSeconds,
      roleSessionName: this.roleSessionName,
    }, this.runtime, this.accessKeySecret);
    this.sessionCredential = json.Credentials;
  }
  needUpdateCredential() {
    if (!this.sessionCredential || !this.sessionCredential.Expiration || !this.sessionCredential.AccessKeyId || !this.sessionCredential.AccessKeySecret || !this.sessionCredential.SecurityToken) {
      return true;
    }
    const current = utils.timestamp();
    if (this.sessionCredential.Expiration < current) {
      return true;
    }
    return false;
  }
  get configParams() {
    return {
      accessKeyId: 'access_key_id',
      accessKeySecret: 'access_key_secret',
      roleArn: 'role_arn'
    };
  }
}

module.exports = RamRoleArnCredential;