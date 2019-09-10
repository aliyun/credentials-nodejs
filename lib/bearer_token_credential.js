'use strict';
const DefaultCredential = require('./default_credential');


class BearerTokenCredential extends DefaultCredential {
  constructor(bearer_token) {
    if (!bearer_token) {
      throw new Error('Missing required bearer_token option in config for bearer');
    }
    super({
      type: 'bearer'
    });
    this.bearerToken = bearer_token;
  }
  getBearerToken() {
    return this.bearerToken;
  }
}

module.exports = BearerTokenCredential;