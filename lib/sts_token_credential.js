'use strict';
const DefaultCredential = require('./default_credential');


class StsTokenCredential extends DefaultCredential {
  constructor(access_key_id, access_key_secret, security_token) {
    if (!access_key_id) {
      throw new Error('Missing required access_key_id option in config for sts');
    }
    if (!access_key_secret) {
      throw new Error('Missing required access_key_secret option in config for sts');
    }
    if (!security_token) {
      throw new Error('Missing required security_token option in config for sts');
    }
    super({
      type: 'sts',
      access_key_id,
      access_key_secret,
      security_token
    });
  }
}

module.exports = StsTokenCredential;