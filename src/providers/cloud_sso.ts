import CredentialsProvider from '../credentials_provider';
import { Session, SessionCredentialProvider, STALE_TIME } from './session';
import { doRequest, Request } from './http';

class CloudSSOCredentialsProviderBuilder {
  signInUrl: string;
  accountId: string;
  accessConfig: string;
  accessToken: string;
  accessTokenExpire: number;
  connectTimeout?: number;
  readTimeout?: number;

  withSignInUrl(signInUrl: string) {
    this.signInUrl = signInUrl;
    return this;
  }

  withAccountId(accountId: string) {
    this.accountId = accountId;
    return this;
  }

  withAccessConfig(accessConfig: string) {
    this.accessConfig = accessConfig;
    return this;
  }

  withAccessToken(accessToken: string) {
    this.accessToken = accessToken;
    return this;
  }

  withAccessTokenExpire(accessTokenExpire: number) {
    this.accessTokenExpire = accessTokenExpire;
    return this;
  }

  withConnectTimeout(connectTimeout: number) {
    this.connectTimeout = connectTimeout;
    return this;
  }

  withReadTimeout(readTimeout: number) {
    this.readTimeout = readTimeout;
    return this;
  }

  build(): CloudSSOCredentialsProvider {
    const now = Math.floor(Date.now() / 1000);
    if (!this.accessToken || !this.accessTokenExpire || this.accessTokenExpire - now <= 0) {
      throw new Error('CloudSSO access token is empty or expired, please re-login with cli.');
    }

    if (!this.signInUrl || !this.accountId || !this.accessConfig) {
      throw new Error('CloudSSO sign in url, account id, and access config cannot be empty.');
    }

    return new CloudSSOCredentialsProvider(this);
  }
}

export default class CloudSSOCredentialsProvider extends SessionCredentialProvider implements CredentialsProvider {
  private readonly signInUrl: string;
  private readonly accountId: string;
  private readonly accessConfig: string;
  private readonly accessToken: string;
  private readonly accessTokenExpire: number;
  private readonly connectTimeout: number;
  private readonly readTimeout: number;
  private doRequest = doRequest;

  static builder() {
    return new CloudSSOCredentialsProviderBuilder();
  }

  constructor(builder: CloudSSOCredentialsProviderBuilder) {
    super(STALE_TIME);
    this.refresher = this.getCredentialsInternal;
    this.signInUrl = builder.signInUrl;
    this.accountId = builder.accountId;
    this.accessConfig = builder.accessConfig;
    this.accessToken = builder.accessToken;
    this.accessTokenExpire = builder.accessTokenExpire;
    this.connectTimeout = builder.connectTimeout || 5000;
    this.readTimeout = builder.readTimeout || 10000;
    this.doRequest = doRequest;
  }

  getProviderName(): string {
    return 'cloud_sso';
  }

  async getCredentialsInternal(): Promise<Session> {
    const url = new URL(this.signInUrl);

    const body = JSON.stringify({
      AccountId: this.accountId,
      AccessConfigurationId: this.accessConfig,
    });

    const headers: { [key: string]: string } = {
      'Accept': 'application/json',
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${this.accessToken}`,
    };

    const request = Request.builder()
      .withMethod('POST')
      .withProtocol(url.protocol.replace(':', ''))
      .withHost(url.host)
      .withPath('/cloud-credentials')
      .withHeaders(headers)
      .withReadTimeout(this.readTimeout)
      .withConnectTimeout(this.connectTimeout)
      .build();

    const response = await this.doRequest(request);

    if (response.statusCode !== 200) {
      throw new Error(`get session token from CloudSSO failed: ${response.body.toString('utf8')}`);
    }

    let data;
    try {
      data = JSON.parse(response.body.toString('utf8'));
    } catch (ex) {
      throw new Error(`get session token from CloudSSO failed, unmarshal fail: ${response.body.toString('utf8')}`);
    }

    if (!data || !data.CloudCredential) {
      throw new Error('get session token from CloudSSO failed, fail to get credentials');
    }

    const { AccessKeyId, AccessKeySecret, SecurityToken, Expiration } = data.CloudCredential;
    if (!AccessKeyId || !AccessKeySecret || !SecurityToken) {
      throw new Error('get session token from CloudSSO failed, fail to get credentials');
    }

    return new Session(AccessKeyId, AccessKeySecret, SecurityToken, Expiration);
  }
}
