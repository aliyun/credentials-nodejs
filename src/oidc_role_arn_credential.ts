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
      throw new Error('Missing required roleArn option in config for oidc_role_arn');
    }

    if (!config.oidcProviderArn) {
      throw new Error('Missing required oidcProviderArn option in config for oidc_role_arn');
    }

    if (!config.oidcTokenFilePath) {
      config.oidcTokenFilePath = process.env['ALIBABA_CLOUD_OIDC_TOKEN_FILE'];
      if (!config.oidcTokenFilePath) {
        throw new Error('oidcTokenFilePath is not exists and env ALIBABA_CLOUD_OIDC_TOKEN_FILE is null.');
      }
    }

    const conf = new Config({
      type: 'oidc_role_arn',
      accessKeyId: config.accessKeyId,
      accessKeySecret: config.accessKeySecret
    });
    super(conf);
    this.oidcTokenFilePath = config.oidcTokenFilePath;
    this.roleArn = config.roleArn;
    this.policy = config.policy;
    this.oidcProviderArn = config.oidcProviderArn;
    this.durationSeconds = config.roleSessionExpiration || 3600;
    this.roleSessionName = config.roleSessionName || 'role_session_name';
    runtime.method = 'POST'
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
    const json = await request(this.host, params, this.runtime, this.accessKeySecret);
    this.sessionCredential = json.Credentials;
  }
}
