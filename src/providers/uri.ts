
import Credentials from '../credentials';
import CredentialsProvider from '../credentials_provider';
import Session from './session'
import { Request, doRequest } from './http'
import { parseUTC } from './time'


/**
 * @internal
 */
export default class URICredentialsProvider implements CredentialsProvider {
  static builder(): URICredentialsProviderBuilder {
    return new URICredentialsProviderBuilder();
  }

  private readonly credentialsURI: string;
  private session: Session
  private doRequest = doRequest;
  private readonly readTimeout: number;
  private readonly connectTimeout: number;
  private expirationTimestamp: number

  public constructor(builder: URICredentialsProviderBuilder) {
    this.credentialsURI = builder.credentialsURI;
    this.readTimeout = builder.readTimeout;
    this.connectTimeout = builder.connectTimeout;
  }

  getProviderName(): string {
    return 'credential_uri';
  }

  async getCredentials(): Promise<Credentials> {
    if (!this.session || this.needUpdateCredential()) {
      const session = await this.getCredentialsUri();
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

  private async getCredentialsUri(): Promise<Session> {
    const builder = Request.builder()
      .withMethod('GET')
      .withURL(this.credentialsURI)
      .withReadTimeout(this.readTimeout || 10000)
      .withConnectTimeout(this.connectTimeout || 5000);

    const request = builder.build();
    const response = await this.doRequest(request);

    if (response.statusCode !== 200) {
      throw new Error(`get sts token failed, httpStatus: ${response.statusCode}, message = ${response.body.toString('utf8')}.`);
    }

    let data;
    try {
      data = JSON.parse(response.body.toString('utf8'));
    } catch (ex) {
      throw new Error(`get sts token failed, json parse failed: ${ex.message}, result: ${response.body.toString('utf8')}.`)
    }

    if (!data || !data.AccessKeyId || !data.AccessKeySecret || !data.SecurityToken) {
      throw new Error(`error retrieving credentials from credentialsURI result: ${JSON.stringify(data)}.`)
    }

    return new Session(data.AccessKeyId, data.AccessKeySecret, data.SecurityToken, data.Expiration);
  }
}



/**
 * @internal
 */
export class URICredentialsProviderBuilder {
  credentialsURI: string;
  readTimeout?: number;
  connectTimeout?: number;

  public withCredentialsURI(credentialsURI: string): URICredentialsProviderBuilder {
    this.credentialsURI = credentialsURI;
    return this;
  }
  withReadTimeout(readTimeout: number): URICredentialsProviderBuilder {
    this.readTimeout = readTimeout
    return this;
  }

  withConnectTimeout(connectTimeout: number): URICredentialsProviderBuilder {
    this.connectTimeout = connectTimeout
    return this;
  }

  public build(): URICredentialsProvider {
    if (!this.credentialsURI) {
      this.credentialsURI = process.env.ALIBABA_CLOUD_CREDENTIALS_URI;
    }
    return new URICredentialsProvider(this);
  }
}
