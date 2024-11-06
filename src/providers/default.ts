import Credentials from '../credentials';
import CredentialsProvider from '../credentials_provider';
import CLIProfileCredentialsProvider from './cli_profile';
import ECSRAMRoleCredentialsProvider from './ecs_ram_role';
import EnvironmentVariableCredentialsProvider from './env';
import OIDCRoleArnCredentialsProvider from './oidc_role_arn';
import URICredentialsProvider from './uri';
import ProfileCredentialsProvider from './profile';

export default class DefaultCredentialsProvider implements CredentialsProvider {
  private readonly providers: CredentialsProvider[];
  private lastUsedProvider: CredentialsProvider;
  static builder() {
    return new DefaultCredentialsProviderBuilder();
  }

  constructor(builder: DefaultCredentialsProviderBuilder) {
    this.providers = [];
    // Add static ak or sts credentials provider from env
    try {
      const envProvider = EnvironmentVariableCredentialsProvider.builder().build();
      this.providers.push(envProvider);
    } catch (ex) {
      // ignore
    }

    // oidc check
    try {
      const oidcProvider = OIDCRoleArnCredentialsProvider.builder().build();
      this.providers.push(oidcProvider);
    } catch (ex) {
      // ignore
    }

    // cli credentials provider
    try {
      const cliProfileProvider = CLIProfileCredentialsProvider.builder().build();
      this.providers.push(cliProfileProvider);
    } catch (ex) {
      // ignore
    }

    // profile credentials provider
    try {
      const profileProvider = ProfileCredentialsProvider.builder().build();
      this.providers.push(profileProvider);
    } catch (ex) {
      // ignore
    }

    // Add IMDS
    try {
      const ecsRamRoleProvider = ECSRAMRoleCredentialsProvider.builder().withRoleName(process.env.ALIBABA_CLOUD_ECS_METADATA).build();
      this.providers.push(ecsRamRoleProvider);
    } catch (ex) {
      // ignore
    }

    // credentials uri
    try {
      const uriProvider = URICredentialsProvider.builder().withCredentialsURI(process.env.ALIBABA_CLOUD_CREDENTIALS_URI).build();
      this.providers.push(uriProvider);
    }
    catch (ex) {
      // ignore
    }
  }

  async getCredentials(): Promise<Credentials> {
    if (this.lastUsedProvider) {
      const inner = await this.lastUsedProvider.getCredentials();
      return Credentials.builder()
        .withAccessKeyId(inner.accessKeyId)
        .withAccessKeySecret(inner.accessKeySecret)
        .withSecurityToken(inner.securityToken)
        .withProviderName(`${this.getProviderName()}/${this.lastUsedProvider.getProviderName()}`)
        .build();
    }

    const errors = [];
    for (const provider of this.providers) {
      this.lastUsedProvider = provider;
      let inner;
      try {
        inner = await provider.getCredentials();
      } catch (ex) {
        errors.push(ex);
        continue;
      }
      if (inner) {
        return Credentials.builder()
          .withAccessKeyId(inner.accessKeyId)
          .withAccessKeySecret(inner.accessKeySecret)
          .withSecurityToken(inner.securityToken)
          .withProviderName(`${this.getProviderName()}/${this.lastUsedProvider.getProviderName()}`)
          .build();
      }
    }

    throw new Error(`unable to get credentials from any of the providers in the chain: ${errors.map((e) => {
      return e.message;
    }).join(', ')}`);
  }

  getProviderName() {
    return 'default';
  }
}

class DefaultCredentialsProviderBuilder {
  build() {
    return new DefaultCredentialsProvider(this);
  }
}
