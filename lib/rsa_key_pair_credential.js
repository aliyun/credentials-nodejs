'use strict';
const defaultCredential = require('./default_credential');
const fs = require('fs');
const utils = require('./util/utils');
const http = require('./util/http');
const securityCredURL = 'http://100.100.100.200/latest/meta-data/ram/security-credentials/';


class RsaKeyPairCredential extends defaultCredential {
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
      type: 'rsa_key_pair',
      public_key_id,
      private_key_file
    });
    this.privateKey = utils.parseFile(private_key_file);
    this.publicKeyId = public_key_id;
  }

  async getAccessKeyId() {
    if (!this.sessionCredential || this.needUpdateCredential()) {
      await this.updateCredential();
    }
    return this.sessionCredential.AccessKeyId;
  }
  async getAccessKeySecret() {
    if (!this.sessionCredential || this.needUpdateCredential()) {
      await this.updateCredential();
    }
    return this.sessionCredential.AccessKeySecret;
  }
  async getSecurityToken() {
    if (!this.sessionCredential || this.needUpdateCredential()) {
      await this.updateCredential();
    }
    return this.sessionCredential.SecurityToken;
  }
  async updateCredential() {
    let url = securityCredURL + this.roleName;
    let json = http.request(url, {
      accessKeyId: this.publicKeyId,
      action: 'GenerateSessionAccessKey',
      DurationSeconds: 3600,
      SignatureMethod: 'SHA256withRSA',
      SignatureType: 'PRIVATEKEY',
    }, {}, this.privateKey);
    this.sessionCredential = json.Credentials;
  }
  needUpdateCredential() {
    if (!this.sessionCredential || !this.sessionCredential.Expiration || !this.sessionCredential.AccessKeyId || !this.sessionCredential.AccessKeySecret || !this.sessionCredential.SecurityToken) {
      return true;
    }
    const current = utils.timestamp();
    if (this.sessionCredential.Expiration < current) {
      return true;
    }
    return false;
  }
  get configParams() {
    return {
      publicKeyId: 'public_key_id',
      privateKeyFile: 'private_key_file'
    };
  }

}

module.exports = RsaKeyPairCredential;