'use strict';


class defaultCredential {
  constructor(props = {}) {
    this.accessKeyId = props.access_key_id || '';
    this.accessKeySecret = props.access_key_secret || '';
    this.securityToken = props.security_token || '';
    this.bearerToken = props.bearer_token || '';
    this.roleName = props.role_name || '';
    this.roleArn = props.role_arn || '';
    this.privateKeyFile = props.private_key_file || '';
    this.publicKeyId = props.public_key_id || '';
    this.type = props.type || '';
    this.verifyConfigParams();
  }

  getAccessKeyId() {
    return this.accessKeyId;
  }
  getAccessKeySecret() {
    return this.accessKeySecret;
  }
  getSecurityToken() {
    return this.securityToken;
  }
  getBearerToken() {
    return this.bearerToken;
  }
  getType() {
    return this.type;
  }
  verifyConfigParams() {
    const params = this.configParams;
    const type = this.type;
    if (!type || !(params instanceof Object)) {
      return;
    }
    for (let [k, v] of Object.entries(params)) {
      if (!this[k]) {
        throw new Error(`Missing required ${v} option in config for ${type}`);
      }
    }
  }
}

module.exports = defaultCredential;