import ICredential from './icredential';

import RsaKeyPairCredential from './rsa_key_pair_credential';
import BearerTokenCredential from './bearer_token_credential';

import Config from './config';
import CredentialModel from './credential_model';

import CredentialsProvider from './credentials_provider';
import StaticAKCredentialsProvider from './providers/static_ak';
import StaticSTSCredentialsProvider from './providers/static_sts';
import RAMRoleARNCredentialsProvider from './providers/ram_role_arn';
import OIDCRoleArnCredentialsProvider from './providers/oidc_role_arn';
import ECSRAMRoleCredentialsProvider from './providers/ecs_ram_role';
import DefaultCredentialsProvider from './providers/default';
import URICredentialsProvider from './providers/uri';
import CLIProfileCredentialsProvider from './providers/cli_profile';
import ProfileCredentialsProvider from './providers/profile';
import EnvironmentVariableCredentialsProvider from './providers/env';

export {
  CredentialModel, Config, DefaultCredentialsProvider, CredentialsProvider,
  StaticAKCredentialsProvider, StaticSTSCredentialsProvider, RAMRoleARNCredentialsProvider,
  OIDCRoleArnCredentialsProvider, ECSRAMRoleCredentialsProvider, URICredentialsProvider,
  EnvironmentVariableCredentialsProvider, ProfileCredentialsProvider, CLIProfileCredentialsProvider
};

class InnerCredentialsClient implements ICredential {
  type: string;
  provider: CredentialsProvider;

  constructor(type: string, provider: CredentialsProvider) {
    this.type = type;
    this.provider = provider;
  }

  /**
   * @deprecated use getCredential() instead of
   * @returns the access key id of credentials
   */
  async getAccessKeyId(): Promise<string> {
    const credentials = await this.provider.getCredentials();
    return credentials.accessKeyId;
  }

  /**
   * @deprecated use getCredential() instead of
   * @returns the access key secret of credentials
   */
  async getAccessKeySecret(): Promise<string> {
    const credentials = await this.provider.getCredentials();
    return credentials.accessKeySecret;
  }

  /**
   * @deprecated use getCredential() instead of
   * @returns the security token of credentials
   */
  async getSecurityToken(): Promise<string> {
    const credentials = await this.provider.getCredentials();
    return credentials.securityToken;
  }

  getBearerToken(): string {
    return;
  }

  getType(): string {
    return this.type;
  }

  async getCredential(): Promise<CredentialModel> {
    const credentials = await this.provider.getCredentials();
    return new CredentialModel({
      accessKeyId: credentials.accessKeyId,
      accessKeySecret: credentials.accessKeySecret,
      securityToken: credentials.securityToken,
      bearerToken: undefined,
      type: this.getType(),
      providerName: credentials.providerName,
    });
  }
}

function isCredentialsProviderClass(t: any): boolean {
  if (!t) {
      return false;
  }
  return typeof t.getCredentials === 'function' && typeof t.getProviderName === 'function';
}

export default class Credential implements ICredential {
  credential: ICredential;
  constructor(config: Config | null = null, provider: CredentialsProvider | { [key: string]: any } | null = null) {
    if (isCredentialsProviderClass(provider)) {
      this.load(null, provider as CredentialsProvider);
    } else {
      this.load(config, null);
    }
  }

  /**
   * @deprecated Use getCredential() instead of
   */
  getAccessKeyId(): Promise<string> {
    return this.credential.getAccessKeyId();
  }

  /**
   * @deprecated Use getCredential() instead of
   */
  getAccessKeySecret(): Promise<string> {
    return this.credential.getAccessKeySecret();
  }

  /**
   * @deprecated Use getCredential() instead of
   */
  getSecurityToken(): Promise<string> {
    return this.credential.getSecurityToken();
  }

  /**
   * @deprecated Use getCredential() instead of
   */
  getBearerToken(): string {
    return this.credential.getBearerToken();
  }

  /**
   * @deprecated Use getCredential() instead of
   */
  getType(): string {
    return this.credential.getType();
  }

  getCredential(): Promise<CredentialModel> {
    return this.credential.getCredential();
  }

  private load(config: Config, provider: CredentialsProvider): void {
    if (provider) {
      this.credential = new InnerCredentialsClient(provider.getProviderName(), provider);
      return;
    }
    if (!config) {
      this.credential = new InnerCredentialsClient('default', DefaultCredentialsProvider.builder().build());
      return;
    }

    if (!config.type) {
      throw new Error('Missing required type option');
    }

    switch (config.type) {
    case 'access_key':
      this.credential = new InnerCredentialsClient('access_key', StaticAKCredentialsProvider.builder()
        .withAccessKeyId(config.accessKeyId)
        .withAccessKeySecret(config.accessKeySecret)
        .build());
      break;
    case 'sts':
      this.credential = new InnerCredentialsClient('sts', StaticSTSCredentialsProvider.builder()
        .withAccessKeyId(config.accessKeyId)
        .withAccessKeySecret(config.accessKeySecret)
        .withSecurityToken(config.securityToken)
        .build());
      break;
    case 'ecs_ram_role':
      this.credential = new InnerCredentialsClient('ecs_ram_role', ECSRAMRoleCredentialsProvider.builder()
        .withRoleName(config.roleName)
        .withDisableIMDSv1(config.disableIMDSv1)
        .withAsyncCredentialUpdateEnabled(config.asyncCredentialUpdateEnabled)
        .withReadTimeout(config.timeout)
        .withConnectTimeout(config.connectTimeout)
        .build());
      break;
    case 'ram_role_arn': {
      let credentialsProvider: CredentialsProvider;
      if (config.securityToken) {
        credentialsProvider = StaticSTSCredentialsProvider.builder()
          .withAccessKeyId(config.accessKeyId)
          .withAccessKeySecret(config.accessKeySecret)
          .withSecurityToken(config.securityToken)
          .build();
      } else {
        credentialsProvider = StaticAKCredentialsProvider.builder()
          .withAccessKeyId(config.accessKeyId)
          .withAccessKeySecret(config.accessKeySecret)
          .build();
      }
      this.credential = new InnerCredentialsClient('ram_role_arn', RAMRoleARNCredentialsProvider.builder()
        .withCredentialsProvider(credentialsProvider)
        .withRoleArn(config.roleArn)
        .withPolicy(config.policy)
        .withDurationSeconds(config.roleSessionExpiration)
        .withRoleSessionName(config.roleSessionName)
        .withReadTimeout(config.timeout)
        .withConnectTimeout(config.connectTimeout)
        .withEnableVpc(config.enableVpc)
        .withStsEndpoint(config.stsEndpoint)
        .withStsRegionId(config.stsRegionId)
        .withExternalId(config.externalId)
        // .withHttpOptions(runtime)
        .build());
    }
      break;
    case 'oidc_role_arn':
      this.credential = new InnerCredentialsClient('oidc_role_arn', OIDCRoleArnCredentialsProvider.builder()
        .withRoleArn(config.roleArn)
        .withOIDCProviderArn(config.oidcProviderArn)
        .withOIDCTokenFilePath(config.oidcTokenFilePath)
        .withRoleSessionName(config.roleSessionName)
        .withPolicy(config.policy)
        .withDurationSeconds(config.roleSessionExpiration)
        .withStsEndpoint(config.stsEndpoint)
        .withStsRegionId(config.stsRegionId)
        .withEnableVpc(config.enableVpc)
        .withReadTimeout(config.timeout)
        .withConnectTimeout(config.connectTimeout)
        .build());
      break;
    case 'rsa_key_pair':
      this.credential = new RsaKeyPairCredential(config.publicKeyId, config.privateKeyFile);
      break;
    case 'bearer':
      this.credential = new BearerTokenCredential(config.bearerToken);
      break;
    case 'credentials_uri':
      this.credential = new InnerCredentialsClient('credentials_uri', URICredentialsProvider.builder()
        .withCredentialsURI(config.credentialsURI)
        .withReadTimeout(config.timeout)
        .withConnectTimeout(config.connectTimeout)
        .build());
      break;
    default:
      throw new Error('Invalid type option, support: access_key, sts, ecs_ram_role, ram_role_arn, rsa_key_pair, credentials_uri');
    }
  }

}
