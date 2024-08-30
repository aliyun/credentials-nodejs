import * as kitx from 'kitx';
import * as utils from '../util/utils';

import Credentials from '../credentials';
import CredentialsProvider from '../credentials_provider'
import { doRequest, Request } from './http';
import { parseUTC } from './time';

class Session {
  accessKeyId: string;
  accessKeySecret: string;
  securityToken: string;
  expiration: string;

  constructor(accessKeyId: string, accessKeySecret: string, securityToken: string, expiration: string) {
    this.accessKeyId = accessKeyId;
    this.accessKeySecret = accessKeySecret;
    this.securityToken = securityToken;
    this.expiration = expiration;
  }
}

// type HttpOptions struct {
// 	Proxy         : string
// 	ConnectTimeout int
// 	ReadTimeout    int
// }

class RAMRoleARNCredentialsProviderBuilder {
  credentialsProvider: CredentialsProvider;
  roleArn: string;
  roleSessionName: string;
  durationSeconds: number;
  stsEndpoint: string;
  stsRegionId: string;
  policy: string;
  externalId: string;

  build(): RAMRoleARNCredentialsProvider {
    if (!this.credentialsProvider) {
      throw new Error('must specify a previous credentials provider to asssume role');
    }

    if (!this.roleArn) {
      throw new Error('the RoleArn is empty')
    }

    if (!this.roleSessionName) {
      this.roleSessionName = 'credentials-nodejs-' + Date.now()
    }

    // duration seconds
    if (!this.durationSeconds) {
      // default to 3600
      this.durationSeconds = 3600
    }

    if (this.durationSeconds < 900) {
      throw new Error('session duration should be in the range of 900s - max session duration');
    }

    // sts endpoint
    if (!this.stsEndpoint) {
      if (this.stsRegionId) {
        this.stsEndpoint = `sts.${this.stsRegionId}.aliyuncs.com`
      } else {
        this.stsEndpoint = 'sts.aliyuncs.com'
      }
    }

    return new RAMRoleARNCredentialsProvider(this);
  }

  withCredentialsProvider(credentialsProvider: CredentialsProvider): RAMRoleARNCredentialsProviderBuilder {
    this.credentialsProvider = credentialsProvider;
    return this;
  }

  withRoleArn(roleArn: string): RAMRoleARNCredentialsProviderBuilder {
    this.roleArn = roleArn
    return this;
  }

  withStsRegionId(regionId: string): RAMRoleARNCredentialsProviderBuilder {
    this.stsRegionId = regionId
    return this;
  }

  withStsEndpoint(endpoint: string): RAMRoleARNCredentialsProviderBuilder {
    this.stsEndpoint = endpoint
    return this;
  }

  withRoleSessionName(roleSessionName: string): RAMRoleARNCredentialsProviderBuilder {
    this.roleSessionName = roleSessionName
    return this;
  }

  withPolicy(policy: string): RAMRoleARNCredentialsProviderBuilder {
    this.policy = policy
    return this;
  }

  withExternalId(externalId: string): RAMRoleARNCredentialsProviderBuilder {
    this.externalId = externalId
    return this;
  }

  withDurationSeconds(durationSeconds: number): RAMRoleARNCredentialsProviderBuilder {
    this.durationSeconds = durationSeconds
    return this;
  }

  // withHttpOptions(httpOptions *HttpOptions) RAMRoleARNCredentialsProviderBuilder {
  //   this.httpOptions = httpOptions
  //   return this;
  // }
}

export default class RAMRoleARNCredentialsProvider implements CredentialsProvider {
  private readonly credentialsProvider: CredentialsProvider;
  private readonly stsEndpoint: string;
  private readonly roleSessionName: string;
  private readonly policy: string;
  private readonly durationSeconds: number;
  private readonly externalId: string;
  private readonly roleArn: string;

  // used for mock
  private doRequest = doRequest;

  private session: Session;
  private lastUpdateTimestamp: number;
  private expirationTimestamp: any;

  static builder(): RAMRoleARNCredentialsProviderBuilder {
    return new RAMRoleARNCredentialsProviderBuilder();
  }

  constructor(builder: RAMRoleARNCredentialsProviderBuilder) {
    this.credentialsProvider = builder.credentialsProvider;
    this.stsEndpoint = builder.stsEndpoint;
    this.roleSessionName = builder.roleSessionName;
    this.policy = builder.policy;
    this.durationSeconds = builder.durationSeconds;
    this.roleArn = builder.roleArn;
    this.externalId = builder.externalId;
  }

  private async getCredentialsInternal(credentials: Credentials): Promise<Session> {
    const method = 'POST';
    const builder = Request.builder().withMethod(method).withProtocol('https').withHost(this.stsEndpoint);

    const queries = Object.create(null);
    queries['Version'] = '2015-04-01';
    queries['Action'] = 'AssumeRole';
    queries['Format'] = 'JSON';
    queries['Timestamp'] = utils.timestamp();
    queries['SignatureMethod'] = 'HMAC-SHA1';
    queries['SignatureVersion'] = '1.0';
    queries['SignatureNonce'] = kitx.makeNonce();
    queries['AccessKeyId'] = credentials.accessKeyId;

    if (credentials.securityToken) {
      queries['SecurityToken'] = credentials.securityToken;
    }

    const bodyForm = Object.create(null);
    bodyForm['RoleArn'] = this.roleArn;
    if (this.policy) {
      bodyForm['Policy'] = this.policy;
    }
    if (this.externalId) {
      bodyForm['ExternalId'] = this.externalId;
    }

    bodyForm['RoleSessionName'] = this.roleSessionName
    bodyForm['DurationSeconds'] = `${this.durationSeconds}`;
    builder.withBodyForm(bodyForm);

    // 	// caculate signature
    // 	signParams := make(map[string]string)
    // 	for key, value := range queries {
    // 		signParams[key] = value
    // 	}
    // 	for key, value := range bodyForm {
    // 		signParams[key] = value
    // 	}

    // 	stringToSign := utils.GetURLFormedMap(signParams)
    // 	stringToSign = strings.Replace(stringToSign, "+", "%20", -1)
    // 	stringToSign = strings.Replace(stringToSign, "*", "%2A", -1)
    // 	stringToSign = strings.Replace(stringToSign, "%7E", "~", -1)
    // 	stringToSign = url.QueryEscape(stringToSign)
    // 	stringToSign = method + "&%2F&" + stringToSign
    // 	secret := cc.AccessKeySecret + "&"
    // 	queries["Signature"] = utils.ShaHmac1(stringToSign, secret)

    builder.withQueries(queries);

    // 	// set headers
    // 	req.Headers["Accept-Encoding"] = "identity"
    // 	req.Headers["Content-Type"] = "application/x-www-form-urlencoded"
    // 	req.Headers["x-acs-credentials-provider"] = cc.ProviderName

    // 	if provider.httpOptions != nil {
    // 		req.ConnectTimeout = time.Duration(provider.httpOptions.ConnectTimeout) * time.Second
    // 		req.ReadTimeout = time.Duration(provider.httpOptions.ReadTimeout) * time.Second
    // 		req.Proxy = provider.httpOptions.Proxy
    // 	}

    const request = builder.build();

    const resonse = await this.doRequest(request);

    if (resonse.statusCode != 200) {
      throw new Error(`refresh session token failed: ${resonse.body.toString('utf8')}`)
    }

    let data;
    try {
      data = JSON.parse(resonse.body.toString('utf8'));
    } catch (ex) {
      throw new Error(`refresh RoleArn sts token err, unmarshal fail: ${resonse.body.toString('utf8')}`);
    }

    if (!data || !data.Credentials) {
      throw new Error(`refresh RoleArn sts token err, fail to get credentials`);
    }

    if (!data.Credentials.AccessKeyId || !data.Credentials.AccessKeySecret || !data.Credentials.SecurityToken) {
      throw new Error('refresh RoleArn sts token err, fail to get credentials')
    }

    const { AccessKeyId, AccessKeySecret, SecurityToken, Expiration } = data.Credentials;
    return new Session(AccessKeyId, AccessKeySecret, SecurityToken, Expiration);
  }

  async getCredentials(): Promise<Credentials> {
    if (!this.session || this.needUpdateCredential()) {
      // 获取前置凭证
      const previousCredentials = await this.credentialsProvider.getCredentials();
      const session = await this.getCredentialsInternal(previousCredentials);
      // UTC time: 2015-04-09T11:52:19Z
      const expirationTime = parseUTC(session.expiration)

      this.expirationTimestamp = Math.floor(expirationTime / 1000);
      this.lastUpdateTimestamp = Date.now();
      this.session = session
    }

    return Credentials.builder()
      .withAccessKeyId(this.session.accessKeyId)
      .withAccessKeySecret(this.session.accessKeySecret)
      .withSecurityToken(this.session.securityToken)
      .withProviderName(`${this.getProviderName()}/${this.credentialsProvider.getProviderName()}`)
      .build();
  }

  needUpdateCredential(): boolean {
    if (!this.expirationTimestamp) {
      return true
    }

    return this.expirationTimestamp - Date.now() / 1000 <= 180
  }

  getProviderName(): string {
    return 'ram_role_arn';
  }
}

// type RAMRoleARNCredentialsProvider struct {
// 	credentialsProvider CredentialsProvider
// 	roleArn            : string
// 	roleSessionName    : string
// 	durationSeconds     int
// 	policy             : string
// 	externalId         : string
// 	// for sts endpoint
// 	stsRegionId: string
// 	stsEndpoint: string
// 	// for http options
// 	httpOptions *HttpOptions
// 	// inner
// 	expirationTimestamp int64
// 	lastUpdateTimestamp int64
// 	sessionCredentials  *sessionCredentials
// }

// type RAMRoleARNCredentialsProviderBuilder struct {
// 	provider *RAMRoleARNCredentialsProvider
// }


// func (provider *RAMRoleARNCredentialsProvider) needUpdateCredential() (result bool) {
// 	if (!this.expirationTimestamp) {
// 		return true
// 	}

// 	return this.expirationTimestamp- Date.now() / 1000 <= 180
// }
