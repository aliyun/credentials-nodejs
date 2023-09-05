import SessionCredential from './session_credential';
import { request } from './util/http';
import Config from './config';

export default class RamRoleArnCredential extends SessionCredential {
  roleArn: string;
  policy: string;
  durationSeconds: number;
  roleSessionName: string;
  runtime: {[key: string]: any};
  host: string;

  constructor(config: Config, runtime: {[key: string]: any} = {}) {
    if (!config.accessKeyId) {
      throw new Error('Missing required accessKeyId option in config for ram_role_arn');
    }

    if (!config.accessKeySecret) {
      throw new Error('Missing required accessKeySecret option in config for ram_role_arn');
    }

    if (!config.roleArn) {
      throw new Error('Missing required roleArn option in config for ram_role_arn');
    }

    const conf = new Config({
      type: 'ram_role_arn',
      accessKeyId: config.accessKeyId,
      accessKeySecret: config.accessKeySecret,
      securityToken: config.securityToken
    });
    super(conf);
    this.roleArn = config.roleArn;
    this.policy = config.policy;
    this.durationSeconds = config.roleSessionExpiration || 3600;
    this.roleSessionName = config.roleSessionName || 'role_session_name';
    this.runtime = runtime;
    this.host = 'https://sts.aliyuncs.com';
  }

  async updateCredential() {
    const params: {[key: string]: any} = {
      accessKeyId: this.accessKeyId,
      securityToken: this.securityToken,
      roleArn: this.roleArn,
      action: 'AssumeRole',
      durationSeconds: this.durationSeconds,
      roleSessionName: this.roleSessionName
    };
    if (this.policy) {
      params.policy = this.policy;
    }
    const json = await request(this.host, params, this.runtime, this.accessKeySecret);
    this.sessionCredential = json.Credentials;
  }
}
