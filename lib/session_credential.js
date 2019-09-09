'use strict';
const DefaultCredential = require('./default_credential');
const utils = require('./util/utils');


class SessionCredential extends DefaultCredential {
  constructor(props) {
    super({
      type: props.type,
      access_key_id: props.access_key_id,
      access_key_secret: props.access_key_secret,
    });
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
}

module.exports = SessionCredential;