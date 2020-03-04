import fs from 'fs';
import SessionCredential from './session_credential';
import * as utils from './util/utils';
import { request } from './util/http';
import ICredential from './icredential';
import Config from './config';

const SECURITY_CRED_URL = 'http://100.100.100.200/latest/meta-data/ram/security-credentials/';

export default class RsaKeyPairCredential extends SessionCredential implements ICredential {
  privateKey: string;
  publicKeyId: string;
  roleName: string;

  constructor(publicKeyId: string, privateKeyFile: string) {
    if (!publicKeyId) {
      throw new Error('Missing required publicKeyId option in config for rsa_key_pair');
    }

    if (!privateKeyFile) {
      throw new Error('Missing required privateKeyFile option in config for rsa_key_pair');
    }

    if (!fs.existsSync(privateKeyFile)) {
      throw new Error(`privateKeyFile ${privateKeyFile} cannot be empty`);
    }

    const conf = new Config({
      type: 'rsa_key_pair'
    });
    super(conf);
    this.privateKey = utils.parseFile(privateKeyFile);
    this.publicKeyId = publicKeyId;
  }

  async updateCredential() {
    const url = SECURITY_CRED_URL + this.roleName;
    const json = await request(url, {
      accessKeyId: this.publicKeyId,
      action: 'GenerateSessionAccessKey',
      durationSeconds: 3600,
      signatureMethod: 'SHA256withRSA',
      signatureType: 'PRIVATEKEY',
    }, {}, this.privateKey);
    this.sessionCredential = json.Credentials;
  }
}
