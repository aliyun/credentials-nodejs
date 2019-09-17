'use strict';
const DefaultCredential = require('./default_credential');


class StsTokenCredential extends DefaultCredential {
  constructor(accessKeyId, accessKeySecret, securityToken) {
    if (!accessKeyId) {
      throw new Error('Missing required accessKeyId option in config for sts');
    }
    if (!accessKeySecret) {
      throw new Error('Missing required accessKeySecret option in config for sts');
    }
    if (!securityToken) {
      throw new Error('Missing required securityToken option in config for sts');
    }
    super({
      type: 'sts',
      accessKeyId,
      accessKeySecret,
      securityToken
    });
  }
}

module.exports = StsTokenCredential;