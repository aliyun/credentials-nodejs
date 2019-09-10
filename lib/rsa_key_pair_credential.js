'use strict';
const SessionCredential = require('./session_credential');
const fs = require('fs');
const utils = require('./util/utils');
const httpUtil = require('./util/http');
const securityCredURL = 'http://100.100.100.200/latest/meta-data/ram/security-credentials/';


class RsaKeyPairCredential extends SessionCredential {
  constructor(public_key_id, private_key_file) {
    if (!public_key_id) {
      throw new Error('Missing required public_key_id option in config for rsa_key_pair');
    }
    if (!private_key_file) {
      throw new Error('Missing required private_key_file option in config for rsa_key_pair');
    }
    if (!fs.existsSync(private_key_file)) {
      throw new Error(`private_key_file ${private_key_file} cannot be empty`);
    }
    super({
      type: 'rsa_key_pair'
    });
    this.privateKey = utils.parseFile(private_key_file);
    this.publicKeyId = public_key_id;
  }

  async updateCredential() {
    let url = securityCredURL + this.roleName;
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