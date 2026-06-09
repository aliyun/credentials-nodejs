import CredentialsProvider from '../credentials_provider';
import { Session, SessionCredentialProvider, STALE_TIME } from './session';
import { doRequest, Request } from './http';
import * as utils from '../util/utils';

export type OAuthTokenUpdateCallback = (
  refreshToken: string, accessToken: string,
  accessKeyId: string, accessKeySecret: string, securityToken: string,
  accessTokenExpire: number, stsExpire: number
) => Promise<void> | void;

class OAuthCredentialsProviderBuilder {
  clientId: string;
  signInUrl: string;
  refreshToken: string;
  accessToken: string;
  accessTokenExpire: number;
  connectTimeout?: number;
  readTimeout?: number;
  tokenUpdateCallback?: OAuthTokenUpdateCallback;

  withClientId(clientId: string) {
    this.clientId = clientId;
    return this;
  }

  withSignInUrl(signInUrl: string) {
    this.signInUrl = signInUrl;
    return this;
  }

  withRefreshToken(refreshToken: string) {
    this.refreshToken = refreshToken;
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

  withTokenUpdateCallback(callback: OAuthTokenUpdateCallback) {
    this.tokenUpdateCallback = callback;
    return this;
  }

  build(): OAuthCredentialsProvider {
    if (!this.clientId) {
      throw new Error('the clientId is empty');
    }
    if (!this.signInUrl) {
      throw new Error('the url for sign-in is empty');
    }
    return new OAuthCredentialsProvider(this);
  }
}

export default class OAuthCredentialsProvider extends SessionCredentialProvider implements CredentialsProvider {
  private readonly clientId: string;
  private readonly signInUrl: string;
  private refreshToken: string;
  private accessToken: string;
  private accessTokenExpire: number;
  private readonly connectTimeout: number;
  private readonly readTimeout: number;
  private readonly tokenUpdateCallback?: OAuthTokenUpdateCallback;
  private doRequest = doRequest;

  static builder() {
    return new OAuthCredentialsProviderBuilder();
  }

  constructor(builder: OAuthCredentialsProviderBuilder) {
    super(STALE_TIME);
    this.refresher = this.getCredentialsInternal;
    this.clientId = builder.clientId;
    this.signInUrl = builder.signInUrl;
    this.refreshToken = builder.refreshToken;
    this.accessToken = builder.accessToken;
    this.accessTokenExpire = builder.accessTokenExpire;
    this.connectTimeout = builder.connectTimeout || 5000;
    this.readTimeout = builder.readTimeout || 10000;
    this.tokenUpdateCallback = builder.tokenUpdateCallback;
    this.doRequest = doRequest;
  }

  getProviderName(): string {
    return 'oauth';
  }

  private async tryRefreshOAuthToken(): Promise<void> {
    const url = new URL(this.signInUrl);

    const bodyForm: { [key: string]: string } = {
      'grant_type': 'refresh_token',
      'refresh_token': this.refreshToken,
      'client_id': this.clientId,
      'Timestamp': utils.timestamp(),
    };

    const headers: { [key: string]: string } = {
      'Content-Type': 'application/x-www-form-urlencoded',
    };

    const request = Request.builder()
      .withMethod('POST')
      .withProtocol(url.protocol.replace(':', ''))
      .withHost(url.host)
      .withPath('/v1/token')
      .withHeaders(headers)
      .withBodyForm(bodyForm)
      .withReadTimeout(this.readTimeout)
      .withConnectTimeout(this.connectTimeout)
      .build();

    const response = await this.doRequest(request);

    if (response.statusCode !== 200) {
      throw new Error(`failed to refresh OAuth token, status code: ${response.statusCode}`);
    }

    let tokenResp;
    try {
      tokenResp = JSON.parse(response.body.toString('utf8'));
    } catch (ex) {
      throw new Error(`failed to refresh OAuth token, unmarshal fail: ${response.body.toString('utf8')}`);
    }

    if (!tokenResp || !tokenResp.access_token || !tokenResp.refresh_token) {
      throw new Error(`failed to refresh OAuth token: ${response.body.toString('utf8')}`);
    }

    this.accessToken = tokenResp.access_token;
    this.refreshToken = tokenResp.refresh_token;
    this.accessTokenExpire = Math.floor(Date.now() / 1000) + (tokenResp.expires_in || 3600);
  }

  async getCredentialsInternal(): Promise<Session> {
    const now = Math.floor(Date.now() / 1000);
    if (this.refreshToken && (!this.accessToken || !this.accessTokenExpire || this.accessTokenExpire - now <= 1200)) {
      await this.tryRefreshOAuthToken();
    }

    const url = new URL(this.signInUrl);

    const headers: { [key: string]: string } = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${this.accessToken}`,
    };

    const request = Request.builder()
      .withMethod('POST')
      .withProtocol(url.protocol.replace(':', ''))
      .withHost(url.host)
      .withPath('/v1/exchange')
      .withHeaders(headers)
      .withReadTimeout(this.readTimeout)
      .withConnectTimeout(this.connectTimeout)
      .build();

    const response = await this.doRequest(request);

    if (response.statusCode !== 200) {
      throw new Error(`get session token from OAuth failed: ${response.body.toString('utf8')}`);
    }

    let data;
    try {
      data = JSON.parse(response.body.toString('utf8'));
    } catch (ex) {
      throw new Error(`get session token from OAuth failed, unmarshal fail: ${response.body.toString('utf8')}`);
    }

    if (!data || !data.accessKeyId || !data.accessKeySecret || !data.securityToken) {
      throw new Error(`refresh session token from OAuth failed, fail to get credentials: ${response.body.toString('utf8')}`);
    }

    if (this.tokenUpdateCallback) {
      try {
        const stsExpire = data.expiration ? Math.floor(new Date(data.expiration).getTime() / 1000) : 0;
        await this.tokenUpdateCallback(
          this.refreshToken, this.accessToken,
          data.accessKeyId, data.accessKeySecret, data.securityToken,
          this.accessTokenExpire, stsExpire
        );
      } catch (e) {
        // Warning only, do not break credential retrieval
      }
    }

    return new Session(data.accessKeyId, data.accessKeySecret, data.securityToken, data.expiration);
  }
}
