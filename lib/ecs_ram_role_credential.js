'use strict';
const SessionCredential = require('./session_credential');
const httpUtil = require('./util/http');
const SECURITY_CRED_URL = 'http://100.100.100.200/latest/meta-data/ram/security-credentials/';


class EcsRamRoleCredential extends SessionCredential {
  constructor(roleName, runtime) {
    if (!roleName) {
      throw new Error('Missing required roleName option in config for ecs_ram_role');
    }
    super({
      type: 'ecs_ram_role',
      roleName,
    });
    this.roleName = roleName;
    this.runtime = runtime;
    this.sessionCredential = null;
  }

  async updateCredential() {
    let url = SECURITY_CRED_URL + this.roleName;
    let json = await httpUtil.request(url, {}, {}, this.accessKeySecret);
    this.sessionCredential = json.Credentials;
  }
}

module.exports = EcsRamRoleCredential;