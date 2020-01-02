'use strict';
const SessionCredential = require('./session_credential');
const httpUtil = require('./util/http');
const SECURITY_CRED_URL = 'http://100.100.100.200/latest/meta-data/ram/security-credentials/';


class EcsRamRoleCredential extends SessionCredential {
  constructor(roleName, runtime) {
    super({
      type: 'ecs_ram_role',
    });
    this.roleName = roleName;
    this.runtime = runtime;
    this.sessionCredential = null;
  }

  async updateCredential() {
    let roleName = await this.getRoleName();
    let url = SECURITY_CRED_URL + roleName;
    let json = await httpUtil.request(url, {}, {}, this.accessKeySecret);
    this.sessionCredential = json.Credentials;
  }

  async getRoleName() {
    if (this.roleName && this.roleName.length) {
      return this.roleName;
    }
    let result = await httpUtil.request(SECURITY_CRED_URL);
    return result;
  }
}

module.exports = EcsRamRoleCredential;