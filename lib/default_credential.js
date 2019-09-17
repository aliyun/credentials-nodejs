'use strict';


class DefaultCredential {
  constructor(props = {}) {
    this.accessKeyId = props.accessKeyId || '';
    this.accessKeySecret = props.accessKeySecret || '';
    this.securityToken = props.securityToken || '';
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