import SessionCredential from './session_credential';
import { Config } from './client';

const httpUtil = require('./util/http');


export default class RamRoleArnCredential extends SessionCredential {
  roleArn: string;
  policy: string;
  durationSeconds: number;
  roleSessionName: string;
  runtime: {[key: string]: any};
  host: string;

  constructor(config: Config, runtime) {
    if (!config.accessKeyId) {
      throw new Error('Missing required accessKeyId option in config for ram_role_arn');
    }
    if (!config.accessKeySecret) {
      throw new Error('Missing required accessKeySecret option in config for ram_role_arn');
    }
    if (!config.roleArn) {
      throw new Error('Missing required roleArn option in config for ram_role_arn');
    }
    super({
      type: 'ram_role_arn',
      accessKeyId: config.accessKeyId,
      accessKeySecret: config.accessKeySecret,
    });
    this.roleArn = config.roleArn;
    this.policy = config.policy;
    this.durationSeconds = config.roleSessionExpiration || 3600;
    this.roleSessionName = config.roleSessionName || 'role_session_name';
    this.runtime = runtime || {};
    this.host = 'https://sts.aliyuncs.com';
  }

  async updateCredential() {
    let params: {[key: string]: any} = {
      accessKeyId: this.accessKeyId,
      roleArn: this.roleArn,
      action: 'AssumeRole',
      durationSeconds: this.durationSeconds,
      roleSessionName: this.roleSessionName
    };
    if (this.policy) {
      params.policy = this.policy;
    }
    let json = await httpUtil.request(this.host, params, this.runtime, this.accessKeySecret);
    this.sessionCredential = json.Credentials;
  }
}
