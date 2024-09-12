import Credentials from '../credentials'
import CredentialsProvider from '../credentials_provider'
import { Request, doRequest } from './http'
import Session from './session'
import { parseUTC } from './time'

const defaultMetadataTokenDuration = 21600; // 6 hours

export default class ECSRAMRoleCredentialsProvider implements CredentialsProvider {
  private readonly roleName: string
  private readonly disableIMDSv1: boolean
  // for sts
  private session: Session
  private expirationTimestamp: number
  // for mock
  private doRequest = doRequest;

  static builder(): ECSRAMRoleCredentialsProviderBuilder {
    return new ECSRAMRoleCredentialsProviderBuilder();
  }

  constructor(builder: ECSRAMRoleCredentialsProviderBuilder) {
    this.roleName = builder.roleName;
    this.disableIMDSv1 = builder.disableIMDSv1;
  }

  async getCredentials(): Promise<Credentials> {
    if (!this.session || this.needUpdateCredential()) {
      const session = await this.getCredentialsInternal();
      const expirationTime = parseUTC(session.expiration);
      this.session = session;
      this.expirationTimestamp = expirationTime / 1000;
    }

    return Credentials.builder()
      .withAccessKeyId(this.session.accessKeyId)
      .withAccessKeySecret(this.session.accessKeySecret)
      .withSecurityToken(this.session.securityToken)
      .withProviderName(this.getProviderName())
      .build();
  }

  private needUpdateCredential(): boolean {
    if (!this.expirationTimestamp) {
      return true
    }

    return this.expirationTimestamp - (Date.now() / 1000) <= 180;
  }

  private async getMetadataToken(): Promise<string> {
    // PUT http://100.100.100.200/latest/api/token
    const request = Request.builder()
      .withMethod('PUT')
      .withProtocol('http')
      .withHost('100.100.100.200')
      .withPath('/latest/api/token')
      .withHeaders({
        'x-aliyun-ecs-metadata-token-ttl-seconds': `${defaultMetadataTokenDuration}`
      })
      .build();

    // ConnectTimeout: 5 * time.Second,
    //   ReadTimeout: 5 * time.Second,
    try {
      const response = await this.doRequest(request);
      if (response.statusCode !== 200) {
        throw new Error(`get metadata token failed with ${response.statusCode}`);
      }
      return response.body.toString('utf8');
    } catch (error) {
      if (this.disableIMDSv1) {
        throw error;
      }
      return null;
    }

  }

  private async getRoleName(): Promise<string> {
    const builder = Request.builder()
      .withMethod('GET')
      .withProtocol('http')
      .withHost('100.100.100.200')
      .withPath('/latest/meta-data/ram/security-credentials/');

    const metadataToken = await this.getMetadataToken();
    if (metadataToken !== null) {
      builder.withHeaders({
        'x-aliyun-ecs-metadata-token': metadataToken
      });
    }

    // ConnectTimeout: 5 * time.Second,
    // ReadTimeout: 5 * time.Second,

    const request = builder.build();
    const response = await this.doRequest(request);

    if (response.statusCode !== 200) {
      throw new Error(`get role name failed: ${request.method} ${request.toRequestURL()} ${response.statusCode}`);
    }

    return response.body.toString().trim();
  }

  private async getCredentialsInternal(): Promise<Session> {
    let roleName = this.roleName
    if (!roleName) {
      roleName = await this.getRoleName();
    }

    const builder = Request.builder()
      .withMethod('GET')
      .withProtocol('http')
      .withHost('100.100.100.200')
      .withPath(`/latest/meta-data/ram/security-credentials/${roleName}`);

    // ConnectTimeout: 5 * time.Second,
    //   ReadTimeout: 5 * time.Second,
    //     Headers: map[string]string{ },

    const metadataToken = await this.getMetadataToken();
    if (metadataToken !== null) {
      builder.withHeaders({
        'x-aliyun-ecs-metadata-token': metadataToken
      });
    }

    const request = builder.build();
    const response = await this.doRequest(request);

    if (response.statusCode !== 200) {
      throw new Error(`get sts token failed, httpStatus: ${response.statusCode}, message = ${response.body.toString()}`);
    }

    let data;
    try {
      data = JSON.parse(response.body.toString());
    } catch (ex) {
      throw new Error(`get sts token failed, json parse failed: ${ex.message}`)
    }

    if (!data || !data.AccessKeyId || !data.AccessKeySecret || !data.SecurityToken) {
      throw new Error('get sts token failed')
    }

    if (data.Code !== 'Success') {
      throw new Error('refresh Ecs sts token err, Code is not Success')
    }

    return new Session(data.AccessKeyId, data.AccessKeySecret, data.SecurityToken, data.Expiration);
  }

  getProviderName(): string {
    return 'ecs_ram_role';
  }
}

class ECSRAMRoleCredentialsProviderBuilder {
  roleName: string
  disableIMDSv1: boolean

  constructor() {
    this.disableIMDSv1 = false;
  }

  withRoleName(roleName: string): ECSRAMRoleCredentialsProviderBuilder {
    this.roleName = roleName
    return this;
  }

  withDisableIMDSv1(disableIMDSv1: boolean): ECSRAMRoleCredentialsProviderBuilder {
    this.disableIMDSv1 = disableIMDSv1
    return this;
  }

  build(): ECSRAMRoleCredentialsProvider {
    // 设置 roleName 默认值
    if (!this.roleName) {
      this.roleName = process.env.ALIBABA_CLOUD_ECS_METADATA;
    }

    // 允许通过环境变量强制关闭 V1
    if (process.env.ALIBABA_CLOUD_IMDSV1_DISABLED === 'true') {
      this.disableIMDSv1 = true;
    }

    return new ECSRAMRoleCredentialsProvider(this);
  }

}
