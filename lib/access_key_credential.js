'use strict';
const DefaultCredential = require('./default_credential');


class AccessKeyCredential extends DefaultCredential {
  constructor(access_key_id, access_key_secret) {
    if (!access_key_id) {
      throw new Error('Missing required access_key_id option in config for access_key');
    }
    if (!access_key_secret) {
      throw new Error('Missing required access_key_secret option in config for access_key');
    }
    super({
      type: 'access_key',
      access_key_id,
      access_key_secret
    });
  }
}

module.exports = AccessKeyCredential;