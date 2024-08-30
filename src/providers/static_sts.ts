
import Credentials from '../credentials';
import CredentialsProvider from '../credentials_provider';

/**
 * @internal
 */
export class StaticSTSCredentialsProviderBuilder {
  accessKeyId: string;
  accessKeySecret: string;
  securityToken: string;

  public withAccessKeyId(accessKeyId: string): StaticSTSCredentialsProviderBuilder {
    this.accessKeyId = accessKeyId;
    return this;
  }

  public withAccessKeySecret(accessKeySecret: string): StaticSTSCredentialsProviderBuilder {
    this.accessKeySecret = accessKeySecret;
    return this;
  }

  public withSecurityToken(securityToken: string): StaticSTSCredentialsProviderBuilder {
    this.securityToken = securityToken;
    return this;
  }

  public build(): StaticSTSCredentialsProvider {
    if (!this.accessKeyId) {
      this.accessKeyId = process.env['ALIBABA_CLOUD_ACCESS_KEY_ID'];
    }

    if (!this.accessKeyId) {
      throw new Error('the access key id is empty');
    }

    if (!this.accessKeySecret) {
      this.accessKeySecret = process.env['ALIBABA_CLOUD_ACCESS_KEY_SECRET'];
    }

    if (!this.accessKeySecret) {
      throw new Error('the access key secret is empty');
    }

    if (!this.securityToken) {
      this.securityToken = process.env['ALIBABA_CLOUD_SECURITY_TOKEN'];
    }

    if (!this.securityToken) {
      throw new Error('the security token is empty');
    }

    return new StaticSTSCredentialsProvider(this);
  }
}

/**
 * @internal
 */
export default class StaticSTSCredentialsProvider implements CredentialsProvider {
  static builder(): StaticSTSCredentialsProviderBuilder {
    return new StaticSTSCredentialsProviderBuilder();
  }

  private readonly accessKeyId: string;
  private readonly accessKeySecret: string;
  private readonly securityToken: string;

  public constructor(builder: StaticSTSCredentialsProviderBuilder) {
    this.accessKeyId = builder.accessKeyId;
    this.accessKeySecret = builder.accessKeySecret;
    this.securityToken = builder.securityToken;
  }

  getProviderName() : string {
    return 'static_sts';
  }

  async getCredentials(): Promise<Credentials> {
    return Credentials.builder()
      .withAccessKeyId(this.accessKeyId)
      .withAccessKeySecret(this.accessKeySecret)
      .withSecurityToken(this.securityToken)
      .withProviderName(this.getProviderName())
      .build();
  }
}
