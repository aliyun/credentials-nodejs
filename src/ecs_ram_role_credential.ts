import SessionCredential from './session_credential';
import httpx from 'httpx';
import ICredential from './icredential';
import Config from './config';

const SECURITY_CRED_URL = 'http://100.100.100.200/latest/meta-data/ram/security-credentials/';

export default class EcsRamRoleCredential extends SessionCredential implements ICredential {
  roleName: string;
  runtime: {[key: string]: any};

  constructor(roleName: string = '', runtime: { [key: string]: any } = {}) {
    const conf = new Config({
      type: 'ecs_ram_role',
    });
    super(conf);
    this.roleName = roleName;
    this.runtime = runtime;
    this.sessionCredential = null;
  }

  async getBody(url: string): Promise<string> {
    const response = await httpx.request(url, {});
    return (await httpx.read(response, 'utf8')) as string;
  }

  async updateCredential(): Promise<void> {
    const roleName = await this.getRoleName();
    const url = SECURITY_CRED_URL + roleName;
    const body = await this.getBody(url);
    const json = JSON.parse(body);
    this.sessionCredential = {
      AccessKeyId: json.AccessKeyId,
      AccessKeySecret: json.AccessKeySecret,
      Expiration: json.Expiration,
      SecurityToken: json.SecurityToken,
    };
  }

  async getRoleName(): Promise<string> {
    if (this.roleName && this.roleName.length) {
      return this.roleName;
    }

    return await this.getBody(SECURITY_CRED_URL);
  }
}