'use strict';


class DefaultCredential {
  constructor(props = {}) {
    this.accessKeyId = props.access_key_id || '';
    this.accessKeySecret = props.access_key_secret || '';
    this.securityToken = props.security_token || '';
    this.type = props.type || '';
  }

  async getAccessKeyId() {
    return this.accessKeyId;
  }

  async getAccessKeySecret() {
    return this.accessKeySecret;
  }

  async getSecurityToken() {
    return this.securityToken;
  }

  getType() {
    return this.type;
  }
}

module.exports = DefaultCredential;