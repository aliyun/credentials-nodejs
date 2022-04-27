import Config from './config';
import ICredential from './icredential';

export default class DefaultCredential implements ICredential {
  accessKeyId: string;
  accessKeySecret: string;
  securityToken?: string;
  bearerToken?: string;
  type: string;

  constructor(config: Config) {
    this.accessKeyId = config.accessKeyId || '';
    this.accessKeySecret = config.accessKeySecret || '';
    this.securityToken = config.securityToken || '';
    this.bearerToken = config.bearerToken || '';
    this.type = config.type || '';
  }

  async getAccessKeyId(): Promise<string> {
    return this.accessKeyId;
  }

  async getAccessKeySecret(): Promise<string> {
    return this.accessKeySecret;
  }

  async getSecurityToken(): Promise<string> {
    return this.securityToken;
  }

  getBearerToken(): string {
    return this.bearerToken;
  }

  getType(): string {
    return this.type;
  }
}
