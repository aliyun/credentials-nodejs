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
    this.durationSeconds = props.durationSeconds || 3600;
  }
  async getAccessKeyId() {
    let needUpdate = this.needUpdateCredential();
    if (needUpdate) {
      await this.updateCredential();
    }
    return this.sessionCredential.AccessKeyId;
  }

  async getAccessKeySecret() {
    let needUpdate = this.needUpdateCredential();
    if (needUpdate) {
      await this.updateCredential();
    }
    return this.sessionCredential.AccessKeySecret;
  }

  async getSecurityToken() {
    let needUpdate = this.needUpdateCredential();
    if (needUpdate) {
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