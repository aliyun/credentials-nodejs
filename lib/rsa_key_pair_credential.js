'use strict';
const SessionCredential = require('./session_credential');
const fs = require('fs');
const utils = require('./util/utils');
const httpUtil = require('./util/http');
const SECURITY_CRED_URL = 'http://100.100.100.200/latest/meta-data/ram/security-credentials/';


class RsaKeyPairCredential extends SessionCredential {
  constructor(publicKeyId, privateKeyFile) {
    if (!publicKeyId) {
      throw new Error('Missing required publicKeyId option in config for rsa_key_pair');
    }
    if (!privateKeyFile) {
      throw new Error('Missing required privateKeyFile option in config for rsa_key_pair');
    }
    if (!fs.existsSync(privateKeyFile)) {
      throw new Error(`privateKeyFile ${privateKeyFile} cannot be empty`);
    }
    super({
      type: 'rsa_key_pair'
    });
    this.privateKey = utils.parseFile(privateKeyFile);
    this.publicKeyId = publicKeyId;
  }

  async updateCredential() {
    let url = SECURITY_CRED_URL + this.roleName;
    let json = httpUtil.request(url, {
      accessKeyId: this.publicKeyId,
      action: 'GenerateSessionAccessKey',
      durationSeconds: 3600,
      signatureMethod: 'SHA256withRSA',
      signatureType: 'PRIVATEKEY',
    }, {}, this.privateKey);
    this.sessionCredential = json.Credentials;
  }
}

module.exports = RsaKeyPairCredential;