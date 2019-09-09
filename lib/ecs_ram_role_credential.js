'use strict';
const defaultCredential = require('./default_credential');
const http = require('./util/http');
const utils = require('./util/utils');
const securityCredURL = 'http://100.100.100.200/latest/meta-data/ram/security-credentials/';


class EcsRamRoleCredential extends defaultCredential {
  constructor(role_name, runtime) {
    super({
      type: 'ecs_ram_role',
      role_name,
    });
    this.roleName = role_name;
    this.runtime = runtime;
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
    let url = securityCredURL + this.roleName;
    let json = await http.request(url, {}, {}, this.accessKeySecret);
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
      roleName: 'role_name'
    };
  }
}

module.exports = EcsRamRoleCredential;