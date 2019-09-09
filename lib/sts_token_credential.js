'use strict';
const defaultCredential = require('./default_credential');


class StsTokenCredential extends defaultCredential {
  constructor(access_key_id, access_key_secret, security_token) {
    super({
      type: 'sts',
      access_key_id,
      access_key_secret,
      security_token
    });
  }
  get configParams() {
    return {
      accessKeyId: 'access_key_id',
      accessKeySecret: 'access_key_secret',
      securityToken: 'security_token'
    };
  }
}

module.exports = StsTokenCredential;