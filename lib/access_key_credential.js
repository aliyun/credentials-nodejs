'use strict';
const DefaultCredential = require('./default_credential');


class AccessKeyCredential extends DefaultCredential {
  constructor(accessKeyId, accessKeySecret) {
    if (!accessKeyId) {
      throw new Error('Missing required accessKeyId option in config for access_key');
    }
    if (!accessKeySecret) {
      throw new Error('Missing required accessKeySecret option in config for access_key');
    }
    super({
      type: 'access_key',
      accessKeyId,
      accessKeySecret
    });
  }
}

module.exports = AccessKeyCredential;