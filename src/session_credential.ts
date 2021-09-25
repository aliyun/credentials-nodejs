import DefaultCredential from './default_credential';
import * as utils from './util/utils';
import Config from './config';

export default class SessionCredential extends DefaultCredential {
  sessionCredential: any;
  durationSeconds: number;
  constructor(config: Config) {
    const conf = new Config({
      type: config.type,
      accessKeyId: config.accessKeyId,
      accessKeySecret: config.accessKeySecret,
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
}

