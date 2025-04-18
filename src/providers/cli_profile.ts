import { readFile } from 'fs';
import { promisify } from 'util';

import path from 'path';
import os from 'os';
import Credentials from '../credentials';
import CredentialsProvider from '../credentials_provider'
import StaticAKCredentialsProvider from './static_ak';
import StaticSTSCredentialsProvider from './static_sts';
import RAMRoleARNCredentialsProvider from './ram_role_arn';
import OIDCRoleArnCredentialsProvider from './oidc_role_arn';
import ECSRAMRoleCredentialsProvider from './ecs_ram_role';

const readFileAsync = promisify(readFile);

class CLIProfileCredentialsProviderBuilder {
  profileName: string;
  build(): CLIProfileCredentialsProvider {
    // 优先级：
    // 1. 使用显示指定的 profileName
    // 2. 使用环境变量（ALIBABA_CLOUD_PROFILE）制定的 profileName
    // 3. 使用 CLI 配置中的当前 profileName
    if (!this.profileName) {
      this.profileName = process.env.ALIBABA_CLOUD_PROFILE;
    }

    if (process.env.ALIBABA_CLOUD_CLI_PROFILE_DISABLED && process.env.ALIBABA_CLOUD_CLI_PROFILE_DISABLED.toLowerCase() === 'true') {
      throw new Error('the CLI profile is disabled');
    }

    return new CLIProfileCredentialsProvider(this);
  }

  withProfileName(profileName: string) {
    this.profileName = profileName;
    return this;
  }
}

interface Profile {
  name: string;
  mode: string;
  access_key_id: string;
  access_key_secret: string;
  sts_token: string;
  region_id: string;
  ram_role_arn: string;
  ram_session_name: string;
  expired_seconds: number;
  sts_region: string;
  source_profile: string;
  ram_role_name: string;
  oidc_token_file: string;
  oidc_provider_arn: string;
  sts_endpoint: string,
  enable_vpc: boolean,
  duration_seconds: number
}

class Configuration {
  current: string;
  profiles: Profile[];
}

export async function getConfiguration(cfgPath: string): Promise<Configuration> {
  let content: string;
  try {
    content = await readFileAsync(cfgPath, 'utf8');
  } catch (ex) {
    throw new Error(`reading aliyun cli config from '${cfgPath}' failed.`);
  }
  let conf: Configuration;
  try {
    conf = JSON.parse(content) as Configuration;
  } catch (ex) {
    throw new Error(`parse aliyun cli config from '${cfgPath}' failed: ${content}`);
  }

  if (!conf || !conf.profiles || conf.profiles.length === 0) {
    throw new Error(`no any configured profiles in '${cfgPath}'`);
  }
  return conf;
}

export function getProfile(conf: Configuration, profileName: string): Profile {
  for (const p of conf.profiles) {
    if (p.name === profileName) {
      return p;
    }
  }

  throw new Error(`unable to get profile with '${profileName}'`);
}

export default class CLIProfileCredentialsProvider implements CredentialsProvider {
  static builder(): CLIProfileCredentialsProviderBuilder {
    return new CLIProfileCredentialsProviderBuilder();
  }
  private readonly profileName: string;
  private innerProvider: CredentialsProvider;

  // used for mock
  private homedir: string = os.homedir();

  constructor(builder: CLIProfileCredentialsProviderBuilder) {
    this.profileName = builder.profileName;
  }

  private getCredentialsProvider(conf: Configuration, profileName: string): CredentialsProvider {
    const p = getProfile(conf, profileName);
    switch (p.mode) {
    case 'AK':
      return StaticAKCredentialsProvider.builder()
        .withAccessKeyId(p.access_key_id)
        .withAccessKeySecret(p.access_key_secret)
        .build();
    case 'StsToken':
      return StaticSTSCredentialsProvider.builder()
        .withAccessKeyId(p.access_key_id)
        .withAccessKeySecret(p.access_key_secret)
        .withSecurityToken(p.sts_token)
        .build();
    case 'RamRoleArn': {
      const previousProvider = StaticAKCredentialsProvider.builder()
        .withAccessKeyId(p.access_key_id)
        .withAccessKeySecret(p.access_key_secret)
        .build();

      return RAMRoleARNCredentialsProvider.builder()
        .withCredentialsProvider(previousProvider)
        .withRoleArn(p.ram_role_arn)
        .withRoleSessionName(p.ram_session_name)
        .withDurationSeconds(p.expired_seconds)
        .withStsRegionId(p.sts_region)
        .withStsEndpoint(p.sts_endpoint)
        .withEnableVpc(p.enable_vpc)
        .build();
    }
    case 'EcsRamRole':
      return ECSRAMRoleCredentialsProvider.builder().withRoleName(p.ram_role_name).build();
    case 'OIDC':
      return OIDCRoleArnCredentialsProvider.builder()
        .withOIDCTokenFilePath(p.oidc_token_file)
        .withOIDCProviderArn(p.oidc_provider_arn)
        .withRoleArn(p.ram_role_arn)
        .withStsRegionId(p.sts_region)
        .withDurationSeconds(p.expired_seconds)
        .withRoleSessionName(p.ram_session_name)
        .withDurationSeconds(p.duration_seconds)
        .withEnableVpc(p.enable_vpc)
        .build();
    case 'ChainableRamRoleArn': {
      const previousProvider = this.getCredentialsProvider(conf, p.source_profile);
      return RAMRoleARNCredentialsProvider.builder()
        .withCredentialsProvider(previousProvider)
        .withRoleArn(p.ram_role_arn)
        .withRoleSessionName(p.ram_session_name)
        .withDurationSeconds(p.expired_seconds)
        .withStsRegionId(p.sts_region)
        .build();
    }
    default:
      throw new Error(`unsupported profile mode '${p.mode}'`);
    }
  }

  async getCredentials(): Promise<Credentials> {
    if (!this.innerProvider) {
      if (!this.homedir) {
        throw new Error('cannot found home dir');
      }

      const cfgPath = path.join(this.homedir, '.aliyun/config.json');

      const conf = await getConfiguration(cfgPath);
      const profileName = this.profileName || conf.current;
      this.innerProvider = this.getCredentialsProvider(conf, profileName)
    }

    const credentials = await this.innerProvider.getCredentials()
    return Credentials.builder()
      .withAccessKeyId(credentials.accessKeyId)
      .withAccessKeySecret(credentials.accessKeySecret)
      .withSecurityToken(credentials.securityToken)
      .withProviderName(`${this.getProviderName()}/${this.innerProvider.getProviderName()}`)
      .build();
  }

  getProviderName(): string {
    return 'cli_profile';
  }

}
