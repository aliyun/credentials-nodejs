import SessionCredential from './session_credential';
import httpx from 'httpx';
import ICredential from './icredential';
import Config from './config';

const SECURITY_CRED_URL = 'http://100.100.100.200/latest/meta-data/ram/security-credentials/';
const SECURITY_CRED_TOKEN_URL = 'http://100.100.100.200/latest/api/token';

export default class EcsRamRoleCredential extends SessionCredential implements ICredential {
  roleName: string;
  enableIMDSv2: boolean;
  metadataTokenDuration?: number;
  runtime: { [key: string]: any };
  metadataToken?: string;
  staleTime?: number
  readTimeout?: number;
  connectTimeout?: number;

  constructor(roleName: string = '', runtime: { [key: string]: any } = {}, enableIMDSv2: boolean = false, metadataTokenDuration: number = 21600) {
    const conf = new Config({
      type: 'ecs_ram_role',
    });
    super(conf);
    this.roleName = roleName;
    this.enableIMDSv2 = enableIMDSv2;
    this.metadataTokenDuration = metadataTokenDuration;
    this.runtime = runtime;
    this.sessionCredential = null;
    this.metadataToken = null;
    this.staleTime = 0;
  }

  async getBody(url: string, options: { [key: string]: any } = {}): Promise<string> {
    const response = await httpx.request(url, options);
    return (await httpx.read(response, 'utf8')) as string;
  }

  async getMetadataToken(): Promise<string> {
    if (this.needToRefresh()) {
      let tmpTime = new Date().getTime() + this.metadataTokenDuration * 1000;
      const response = await httpx.request(SECURITY_CRED_TOKEN_URL, {
        headers: {
          'X-aliyun-ecs-metadata-token-ttl-seconds': `${this.metadataTokenDuration}`
        },
        method: "PUT"
      });
      if (response.statusCode !== 200) {
        throw new Error(`Failed to get token from ECS Metadata Service. HttpCode=${response.statusCode}`);
      }
      this.staleTime = tmpTime;
      return (await httpx.read(response, 'utf8')) as string;
    }
    return this.metadataToken;
  }

  async updateCredential(): Promise<void> {
    let options = {};
    if (this.enableIMDSv2) {
      this.metadataToken = await this.getMetadataToken();
      options = {
        headers: {
          'X-aliyun-ecs-metadata-token': this.metadataToken
        },
        readTimeout: this.readTimeout,
        connectTimeout: this.connectTimeout
      }
    }
    const roleName = await this.getRoleName();
    const url = SECURITY_CRED_URL + roleName;
    const body = await this.getBody(url, options);
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

  needToRefresh() {
    return new Date().getTime() >= this.staleTime;
  }
}