'use strict';
const SessionCredential = require('./session_credential');
const httpUtil = require('./util/http');
const securityCredURL = 'http://100.100.100.200/latest/meta-data/ram/security-credentials/';


class EcsRamRoleCredential extends SessionCredential {
  constructor(role_name, runtime) {
    if (!role_name) {
      throw new Error('Missing required role_name option in config for ecs_ram_role');
    }
    super({
      type: 'ecs_ram_role',
      role_name,
    });
    this.roleName = role_name;
    this.runtime = runtime;
    this.sessionCredential = null;
  }

  async updateCredential() {
    let url = securityCredURL + this.roleName;
    let json = await httpUtil.request(url, {}, {}, this.accessKeySecret);
    this.sessionCredential = json.Credentials;
  }
}

module.exports = EcsRamRoleCredential;