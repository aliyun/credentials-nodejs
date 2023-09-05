import DefaultCredential from './default_credential';
import * as utils from './util/utils';
import Config from './config';
import CredentialModel from './credential_model';

export default class SessionCredential extends DefaultCredential {
  sessionCredential: any;
  durationSeconds: number;

  constructor(config: Config) {
    const conf = new Config({
      type: config.type,
      accessKeyId: config.accessKeyId,
      accessKeySecret: config.accessKeySecret,
      securityToken: config.securityToken
    });
    super(conf);
    this.sessionCredential = null;
    this.durationSeconds = config.durationSeconds || 3600;
  }

  async updateCredential(): Promise<void> {
    throw new Error('need implemented in sub-class');
  }

  async ensureCredential(): Promise<void> {
    const needUpdate = this.needUpdateCredential();
    if (needUpdate) {
      await this.updateCredential();
    }
  }

  async getAccessKeyId() {
    await this.ensureCredential();
    return this.sessionCredential.AccessKeyId;
  }

  async getAccessKeySecret() {
    await this.ensureCredential();
    return this.sessionCredential.AccessKeySecret;
  }

  async getSecurityToken() {
    await this.ensureCredential();
    return this.sessionCredential.SecurityToken;
  }

  needUpdateCredential() {
    if (!this.sessionCredential || !this.sessionCredential.Expiration || !this.sessionCredential.AccessKeyId || !this.sessionCredential.AccessKeySecret || !this.sessionCredential.SecurityToken) {
      return true;
    }
    const expireTime = utils.timestamp(new Date(), this.durationSeconds * 0.05 * 1000);
    if (this.sessionCredential.Expiration < expireTime) {
      return true;
    }
    return false;
  }

  async getCredential(): Promise<CredentialModel> {
    await this.ensureCredential();
    return new CredentialModel({
      accessKeyId: this.sessionCredential.AccessKeyId,
      accessKeySecret: this.sessionCredential.AccessKeySecret,
      securityToken: this.sessionCredential.SecurityToken,
      bearerToken: this.bearerToken,
      type: this.type,
    });
  }
}

