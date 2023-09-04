import ICredential from './icredential';

import AccessKeyCredential from './access_key_credential';
import StsTokenCredential from './sts_token_credential';
import EcsRamRoleCredential from './ecs_ram_role_credential';
import RamRoleArnCredential from './ram_role_arn_credential';
import OidcRoleArnCredential from './oidc_role_arn_credential'
import RsaKeyPairCredential from './rsa_key_pair_credential';
import BearerTokenCredential from './bearer_token_credential';
import * as DefaultProvider from './provider/provider_chain';
import Config from './config';
import URICredential from './uri_credential';
import CredentialModel from './credential_model';

export { Config };

export default class Credential implements ICredential {
  credential: ICredential;
  constructor(config: Config = null, runtime: { [key: string]: any } = {}) {
    this.load(config, runtime);
  }

  getAccessKeyId(): Promise<string> {
    return this.credential.getAccessKeyId();
  }

  getAccessKeySecret(): Promise<string> {
    return this.credential.getAccessKeySecret();
  }

  getSecurityToken(): Promise<string> {
    return this.credential.getSecurityToken();
  }

  getBearerToken(): string {
    return this.credential.getBearerToken();
  }

  getType(): string {
    return this.credential.getType();
  }

  getCredential(): Promise<CredentialModel> {
    return this.credential.getCredential();
  }

  private load(config: Config, runtime: { [key: string]: any }): void {
    if (!config) {
      this.credential = DefaultProvider.getCredentials();
      return;
    }

    if (!config.type) {
      throw new Error('Missing required type option');
    }

    switch (config.type) {
      case 'access_key':
        this.credential = new AccessKeyCredential(config.accessKeyId, config.accessKeySecret);
        break;
      case 'sts':
        this.credential = new StsTokenCredential(config.accessKeyId, config.accessKeySecret, config.securityToken);
        break;
      case 'ecs_ram_role':
        this.credential = new EcsRamRoleCredential(config.roleName);
        break;
      case 'ram_role_arn':
        this.credential = new RamRoleArnCredential(config, runtime);
        break;
      case 'oidc_role_arn':
        this.credential = new OidcRoleArnCredential(config, runtime);
        break;
      case 'rsa_key_pair':
        this.credential = new RsaKeyPairCredential(config.publicKeyId, config.privateKeyFile);
        break;
      case 'bearer':
        this.credential = new BearerTokenCredential(config.bearerToken);
        break;
      case 'credentials_uri':
        this.credential = new URICredential(config.credentialsURI);
        break;
      default:
        throw new Error('Invalid type option, support: access_key, sts, ecs_ram_role, ram_role_arn, rsa_key_pair, credentials_uri');
    }
  }

}
