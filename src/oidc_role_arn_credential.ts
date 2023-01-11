import SessionCredential from './session_credential';
import { request } from './util/http';
import Config from './config';
import fs from 'fs';

export default class OidcRoleArnCredential extends SessionCredential {
  roleArn: string;
  oidcProviderArn: string;
  oidcTokenFilePath: string;
  policy: string;
  durationSeconds: number;
  roleSessionName: string;
  runtime: { [key: string]: any };
  host: string;

  constructor(config: Config, runtime: { [key: string]: any } = {}) {
    if (!config.roleArn) {
      config.roleArn = process.env.ALIBABA_CLOUD_ROLE_ARN;
      if (!config.roleArn) {
        throw new Error('roleArn does not exist and env ALIBABA_CLOUD_ROLE_ARN is null.');
      }
    }

    if (!config.oidcProviderArn) {
      config.oidcProviderArn = process.env.ALIBABA_CLOUD_OIDC_PROVIDER_ARN;
      if (!config.oidcProviderArn) {
        throw new Error('oidcProviderArn does not exist and env ALIBABA_CLOUD_OIDC_PROVIDER_ARN is null.');
      }
    }

    if (!config.oidcTokenFilePath) {
      config.oidcTokenFilePath = process.env.ALIBABA_CLOUD_OIDC_TOKEN_FILE;
      if (!config.oidcTokenFilePath) {
        throw new Error('oidcTokenFilePath is not exists and env ALIBABA_CLOUD_OIDC_TOKEN_FILE is null.');
      }
    }

    if (!config.roleSessionName && process.env.ALIBABA_CLOUD_ROLE_SESSION_NAME) {
      config.roleSessionName = process.env.ALIBABA_CLOUD_ROLE_SESSION_NAME;
    }

    const conf = new Config({
      type: 'oidc_role_arn'
    });
    super(conf);
    this.oidcTokenFilePath = config.oidcTokenFilePath;
    this.roleArn = config.roleArn;
    this.policy = config.policy;
    this.oidcProviderArn = config.oidcProviderArn;
    this.durationSeconds = config.roleSessionExpiration || 3600;
    this.roleSessionName = config.roleSessionName || 'role_session_name';
    runtime.method = 'POST';
    runtime.anonymous = true;
    this.runtime = runtime;
    this.host = 'https://sts.aliyuncs.com';
  }

  private getOdicToken(oidcTokenFilePath: string): string {
    if (!fs.existsSync(oidcTokenFilePath)) {
      throw new Error(`oidcTokenFilePath ${oidcTokenFilePath}  is not exists.`);
    }
    let oidcToken = null;
    try {
      oidcToken = fs.readFileSync(oidcTokenFilePath, 'utf-8');
    } catch (err) {
      throw new Error(`oidcTokenFilePath ${oidcTokenFilePath} cannot be read.`);
    }
    return oidcToken;
  }

  async updateCredential() {
    const oidcToken = this.getOdicToken(this.oidcTokenFilePath);
    const params: { [key: string]: any } = {
      Action: 'AssumeRoleWithOIDC',
      RoleArn: this.roleArn,
      OIDCProviderArn: this.oidcProviderArn,
      OIDCToken: oidcToken,
      DurationSeconds: this.durationSeconds,
      RoleSessionName: this.roleSessionName
    };
    if (this.policy) {
      params.policy = this.policy;
    }
    const json = await request(this.host, params, this.runtime);
    this.sessionCredential = json.Credentials;
  }
}
