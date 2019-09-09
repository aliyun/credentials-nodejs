'use strict';
const DefaultCredential = require('./default_credential');


class AccessKeyCredential extends DefaultCredential {
  constructor(access_key_id, access_key_secret) {
    super({
      type: 'access_key',
      access_key_id,
      access_key_secret
    });
  }
  get configParams() {
    return {
      accessKeyId: 'access_key_id',
      accessKeySecret: 'access_key_secret'
    };
  }
}

module.exports = AccessKeyCredential;