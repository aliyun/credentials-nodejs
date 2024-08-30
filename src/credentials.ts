export default class Credentials {
  readonly accessKeyId: string;
  readonly accessKeySecret: string;
  readonly securityToken: string;
  readonly providerName: string;

  constructor(builder : CredentialsBuilder) {
    this.accessKeyId = builder.accessKeyId;
    this.accessKeySecret = builder.accessKeySecret;
    this.securityToken = builder.securityToken;
    this.providerName = builder.providerName;
  }

  static builder() : CredentialsBuilder {
    return new CredentialsBuilder();
  }
}

export class CredentialsBuilder {
  accessKeyId: string;
  accessKeySecret: string;
  securityToken: string;
  providerName: string;

  public withAccessKeyId(value: string) {
    this.accessKeyId = value;
    return this;
  }

  public withAccessKeySecret(value: string) {
    this.accessKeySecret = value;
    return this;
  }

  public withSecurityToken(value: string) {
    this.securityToken = value;
    return this;
  }

  public withProviderName(value: string) {
    this.providerName = value;
    return this;
  }

  public build(): Credentials {
    return new Credentials(this);
  }
}