
import Credentials from '../credentials';
import CredentialsProvider from '../credentials_provider';

/**
 * @internal
 */
export class StaticAKCredentialsProviderBuilder {
  accessKeyId: string;
  accessKeySecret: string;

  public withAccessKeyId(accessKeyId: string): StaticAKCredentialsProviderBuilder {
    this.accessKeyId = accessKeyId;
    return this;
  }

  public withAccessKeySecret(accessKeySecret: string): StaticAKCredentialsProviderBuilder {
    this.accessKeySecret = accessKeySecret;
    return this;
  }

  public build(): StaticAKCredentialsProvider {
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

    return new StaticAKCredentialsProvider(this);
  }
}

/**
 * @internal
 */
export default class StaticAKCredentialsProvider implements CredentialsProvider {
  static builder(): StaticAKCredentialsProviderBuilder {
    return new StaticAKCredentialsProviderBuilder();
  }

  private readonly accessKeyId: string;
  private readonly accessKeySecret: string;

  public constructor(builder : StaticAKCredentialsProviderBuilder) {
    this.accessKeyId = builder.accessKeyId;
    this.accessKeySecret = builder.accessKeySecret;
  }

  getProviderName() : string {
    return 'static_ak';
  }

  async getCredentials() : Promise<Credentials> {
    const credentials = Credentials
      .builder()
      .withAccessKeyId(this.accessKeyId).withAccessKeySecret(this.accessKeySecret)
      .withProviderName('static_ak')
      .build();
    return credentials;
  }
}
