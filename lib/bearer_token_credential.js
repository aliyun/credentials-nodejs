'use strict';
const DefaultCredential = require('./default_credential');


class BearerTokenCredential extends DefaultCredential {
  constructor(bearerToken) {
    if (!bearerToken) {
      throw new Error('Missing required bearerToken option in config for bearer');
    }
    super({
      type: 'bearer'
    });
    this.bearerToken = bearerToken;
  }

  getBearerToken() {
    return this.bearerToken;
  }
}

module.exports = BearerTokenCredential;