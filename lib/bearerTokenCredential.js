'use strict';
const DefaultCredential = require('./defaultCredential');


class BearerTokenCredential extends DefaultCredential {
  constructor(bearer_token) {
    super({
      type: 'bearer',
      bearer_token
    });
  }
  get configParams() {
    return {
      bearerToken: 'bearer_token'
    };
  }
}

module.exports = BearerTokenCredential;