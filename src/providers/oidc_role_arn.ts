import { readFile } from 'fs';
import { promisify } from 'util';

import Credentials from '../credentials';
import CredentialsProvider from '../credentials_provider';
import { Session, SessionCredentialProvider, STALE_TIME } from './session';
import * as utils from '../util/utils';
import { doRequest, Request } from './http';

const readFileAsync = promisify(readFile);

class OIDCRoleArnCredentialsProviderBuilder {
  oidcProviderArn: any;
  oidcTokenFilePath: any;
  roleArn: any;
  roleSessionName: string;
  stsEndpoint: string;
  stsRegionId: string;
  policy: string;
  durationSeconds: number;
  enableVpc?: boolean;
  readTimeout?: number;
  connectTimeout?: number;

  withOIDCProviderArn(oidcProviderArn: string) {
    this.oidcProviderArn = oidcProviderArn;
    return this;
  }

  withOIDCTokenFilePath(path: string) {
    this.oidcTokenFilePath = path;
    return this;
  }

  withRoleArn(roleArn: string) {
    this.roleArn = roleArn;
    return this;
  }

  withRoleSessionName(roleSessionName: string) {
    this.roleSessionName = roleSessionName;
    return this;
  }

  withDurationSeconds(durationSeconds: number) {
    this.durationSeconds = durationSeconds;
    return this;
  }

  withStsEndpoint(stsEndpoint: string) {
    this.stsEndpoint = stsEndpoint;
    return this;
  }

  withStsRegionId(regionId: string) {
    this.stsRegionId = regionId;
    return this;
  }

  withPolicy(policy: string) {
    this.policy = policy;
    return this;
  }

  withEnableVpc(enableVpc: boolean): OIDCRoleArnCredentialsProviderBuilder {
    this.enableVpc = enableVpc
    return this;
  }

  withReadTimeout(readTimeout: number): OIDCRoleArnCredentialsProviderBuilder {
    this.readTimeout = readTimeout
    return this;
  }

  withConnectTimeout(connectTimeout: number): OIDCRoleArnCredentialsProviderBuilder {
    this.connectTimeout = connectTimeout
    return this;
  }

  build(): OIDCRoleArnCredentialsProvider {
    // set default values
    if (!this.oidcProviderArn) {
      this.oidcProviderArn = process.env.ALIBABA_CLOUD_OIDC_PROVIDER_ARN;
    }

    if (!this.oidcTokenFilePath) {
      this.oidcTokenFilePath = process.env.ALIBABA_CLOUD_OIDC_TOKEN_FILE;
    }

    if (!this.roleSessionName) {
      this.roleSessionName = process.env.ALIBABA_CLOUD_ROLE_SESSION_NAME;
    }

    if (!this.durationSeconds) {
      this.durationSeconds = 3600;
    }

    if (!this.roleArn) {
      this.roleArn = process.env.ALIBABA_CLOUD_ROLE_ARN;
    }

    if (!this.roleArn) {
      throw new Error('roleArn does not exist and env ALIBABA_CLOUD_ROLE_ARN is null.');
    }

    if (!this.oidcProviderArn) {
      throw new Error('oidcProviderArn does not exist and env ALIBABA_CLOUD_OIDC_PROVIDER_ARN is null.');
    }

    if (!this.oidcTokenFilePath) {
      throw new Error('oidcTokenFilePath is not exists and env ALIBABA_CLOUD_OIDC_TOKEN_FILE is null.');
    }

    if (!this.roleSessionName) {
      this.roleSessionName = 'credentials-nodejs-' + Date.now()
    }

    if (this.durationSeconds < 900) {
      throw new Error('session duration should be in the range of 900s - max session duration');
    }

    if (!this.stsRegionId) {
      this.stsRegionId = process.env.ALIBABA_CLOUD_STS_REGION;
    }

    if (!this.enableVpc) {
      this.enableVpc = process.env.ALIBABA_CLOUD_VPC_ENDPOINT_ENABLED && process.env.ALIBABA_CLOUD_VPC_ENDPOINT_ENABLED.toLowerCase() === 'true' || false;
    }

    // sts endpoint
    if (!this.stsEndpoint) {
      if (this.stsRegionId) {
        if (this.enableVpc) {
          this.stsEndpoint = `sts-vpc.${this.stsRegionId}.aliyuncs.com`
        } else {
          this.stsEndpoint = `sts.${this.stsRegionId}.aliyuncs.com`
        }
      } else { this.stsEndpoint = 'sts.aliyuncs.com' }
    }

    return new OIDCRoleArnCredentialsProvider(this);
  }
}

export default class OIDCRoleArnCredentialsProvider extends SessionCredentialProvider implements CredentialsProvider {
  private readonly roleArn: string;
  private readonly oidcProviderArn: string;
  private readonly oidcTokenFilePath: string;
  private readonly policy: string;
  private readonly durationSeconds: number;
  private readonly roleSessionName: string;
  runtime: { [key: string]: any };
  private readonly stsEndpoint: string;
  private doRequest = doRequest;
  private readonly readTimeout: number;
  private readonly connectTimeout: number;

  lastUpdateTimestamp: number;

  static builder() {
    return new OIDCRoleArnCredentialsProviderBuilder();
  }

  constructor(builder: OIDCRoleArnCredentialsProviderBuilder) {
    super(STALE_TIME);
    this.refresher = this.getCredentialsInternal;
    this.roleArn = builder.roleArn;
    this.oidcProviderArn = builder.oidcProviderArn;
    this.oidcTokenFilePath = builder.oidcTokenFilePath;
    this.policy = builder.policy;
    this.durationSeconds = builder.durationSeconds;
    this.roleSessionName = builder.roleSessionName;
    this.stsEndpoint = builder.stsEndpoint;
    this.readTimeout = builder.readTimeout;
    this.connectTimeout = builder.connectTimeout;
    // used for mock
    this.doRequest = doRequest;
  }

  getProviderName(): string {
    return 'oidc_role_arn';
  }

  async getCredentialsInternal(): Promise<Session> {
    const oidcToken = await readFileAsync(this.oidcTokenFilePath, 'utf8');
    const builder = Request.builder().withMethod('POST').withProtocol('https').withHost(this.stsEndpoint).withReadTimeout(this.readTimeout || 10000).withConnectTimeout(this.connectTimeout || 5000);

    const queries = Object.create(null);
    queries['Version'] = '2015-04-01';
    queries['Action'] = 'AssumeRoleWithOIDC';
    queries['Format'] = 'JSON';
    queries['Timestamp'] = utils.timestamp();
    builder.withQueries(queries);

    const bodyForm = Object.create(null);
    bodyForm['OIDCProviderArn'] = this.oidcProviderArn;
    bodyForm['OIDCToken'] = oidcToken;
    bodyForm['RoleArn'] = this.roleArn;
    if (this.policy) {
      bodyForm['Policy'] = this.policy;
    }

    bodyForm['RoleSessionName'] = this.roleSessionName
    bodyForm['DurationSeconds'] = `${this.durationSeconds}`;

    builder.withBodyForm(bodyForm);

    const headers = Object.create(null);
    // set headers
    headers['Content-Type'] = 'application/x-www-form-urlencoded';
    builder.withHeaders(headers);

    const request = builder.build();
    const response = await this.doRequest(request);

    if (response.statusCode !== 200) {
      throw new Error(`get sts token failed with OIDC: ${response.body.toString('utf8')}`)
    }

    let data;
    try {
      data = JSON.parse(response.body.toString('utf8'));
    } catch (ex) {
      throw new Error(`get sts token failed with OIDC, unmarshal fail: ${response.body.toString('utf8')}`);
    }

    if (!data || !data.Credentials) {
      throw new Error(`get sts token failed with OIDC`);
    }

    const { AccessKeyId, AccessKeySecret, SecurityToken, Expiration } = data.Credentials;
    if (!AccessKeyId || !AccessKeySecret || !SecurityToken) {
      throw new Error('get sts token failed with OIDC')
    }

    return new Session(AccessKeyId, AccessKeySecret, SecurityToken, Expiration);
  }
}
