import path from 'path';
import os from 'os';

import Credentials from '../credentials';
import CredentialsProvider from '../credentials_provider';
import { loadIni } from '../util/utils';

import StaticAKCredentialsProvider from './static_ak';
import ECSRAMRoleCredentialsProvider from './ecs_ram_role';
import RAMRoleARNCredentialsProvider from './ram_role_arn';
import OIDCRoleArnCredentialsProvider from './oidc_role_arn'

export default class ProfileCredentialsProvider implements CredentialsProvider {
  private readonly profileName: string;
  private innerProvider: CredentialsProvider;
  // used for mock
  private readonly homedir: string = os.homedir();

  async getCredentials(): Promise<Credentials> {
    if (!this.innerProvider) {
      let sharedCfgPath = process.env.ALIBABA_CLOUD_CREDENTIALS_FILE;
      if (!sharedCfgPath) {
        if (!this.homedir) {
          throw new Error('cannot found home dir');
        }
        sharedCfgPath = path.join(this.homedir, '.alibabacloud/credentials');
      }

      const ini = await loadIni(sharedCfgPath);
      this.innerProvider = this.getCredentialsProvider(ini);
    }

    const credentials = await this.innerProvider.getCredentials();

    return Credentials.builder()
      .withAccessKeyId(credentials.accessKeyId)
      .withAccessKeySecret(credentials.accessKeySecret)
      .withSecurityToken(credentials.securityToken)
      .withProviderName(`${this.getProviderName()}/${this.innerProvider.getProviderName()}`)
      .build();
  }

  getCredentialsProvider(ini: any): CredentialsProvider {
    const config = ini[this.profileName] || {};
    if (!config.type) {
      throw new Error(`Can not find credential type for "${this.profileName}"`);
    }

    switch (config.type) {
      case 'access_key':
        return StaticAKCredentialsProvider.builder()
          .withAccessKeyId(config.access_key_id)
          .withAccessKeySecret(config.access_key_secret)
          .build();
      case 'ecs_ram_role':
        return ECSRAMRoleCredentialsProvider.builder()
          .withRoleName(config.role_name)
          .build();
      case 'ram_role_arn':
        {
          const previous = StaticAKCredentialsProvider.builder()
            .withAccessKeyId(config.access_key_id)
            .withAccessKeySecret(config.access_key_secret)
            .build();
          return RAMRoleARNCredentialsProvider.builder()
            .withCredentialsProvider(previous)
            .withRoleArn(config.role_arn)
            .withRoleSessionName(config.role_session_name)
            .withPolicy(config.policy)
            // .withStsEndpoint(config.stsEndpoint)
            // .withStsRegionId(config.stsRegionId)
            // .withEnableVpc(config.enableVpc)
            // .withExternalId(config.enableVpc)
            .build();
        }
      default:
        throw new Error('Invalid type option, support: access_key, ecs_ram_role, ram_role_arn');
    }
  }

  getProviderName(): string {
    return 'profile';
  }

  public static builder(): ProfileCredentialsProviderBuilder {
    return new ProfileCredentialsProviderBuilder();
  }

  constructor(builder: ProfileCredentialsProviderBuilder) {
    this.profileName = builder.profileName;
  }
}

class ProfileCredentialsProviderBuilder {
  profileName: string;

  withProfileName(profileName: string) {
    this.profileName = profileName;
    return this;
  }

  build() {
    // 优先级：
    // 1. 使用显示指定的 profileName
    // 2. 使用环境变量（ALIBABA_CLOUD_PROFILE）指定的 profileName
    // 3. 兜底使用 default 作为 profileName
    if (!this.profileName) {
      this.profileName = process.env.ALIBABA_CLOUD_PROFILE || 'default';
    }

    return new ProfileCredentialsProvider(this);
  }

}
