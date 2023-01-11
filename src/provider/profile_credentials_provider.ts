import AccessKeyCredential from '../access_key_credential';
import StsTokenCredential from '../sts_token_credential';
import EcsRamRoleCredential from '../ecs_ram_role_credential';
import RamRoleArnCredential from '../ram_role_arn_credential';
import OidcRoleArnCredential from '../oidc_role_arn_credential';
import RsaKeyPairCredential from '../rsa_key_pair_credential';
import BearerTokenCredential from '../bearer_token_credential';

import * as utils from '../util/utils';
import fs from 'fs';
import ICredential from '../icredential';
import Config from '../config';

const DEFAULT_PATH = process.env.HOME + '/.alibabacloud/credentials';

export default {
  getCredential(credentialName: string = 'default'): ICredential {
    let fileContent = null;
    const credentialFile = process.env.ALIBABA_CLOUD_CREDENTIALS_FILE;
    if (credentialFile === undefined) {
      if (fs.existsSync(DEFAULT_PATH)) {
        const content = utils.parseFile(DEFAULT_PATH, true);
        if (content) {
          fileContent = content;
        }
      }
    } else {
      if (credentialFile === null || credentialFile === '') {
        throw new Error('Environment variable credentialFile cannot be empty');
      }
      if (!fs.existsSync(credentialFile)) {
        throw new Error(`credentialFile ${credentialFile} cannot be empty`);
      }
      fileContent = utils.parseFile(credentialFile);
    }

    if (!fileContent) {
      return null;
    }

    const config = fileContent[credentialName] || {};
    if (!config.type) {
      throw new Error('Missing required type option in credentialFile');
    }

    switch (config.type) {
    case 'access_key':
      return new AccessKeyCredential(config.access_key_id, config.access_key_secret);
    case 'sts':
      return new StsTokenCredential(config.access_key_id, config.access_key_secret, config.security_token);
    case 'ecs_ram_role':
      return new EcsRamRoleCredential(config.role_name);
    case 'ram_role_arn': {
      const conf = new Config({
        roleArn: config.role_arn,
        accessKeyId: config.access_key_id,
        accessKeySecret: config.access_key_secret
      });
      return new RamRoleArnCredential(conf);
    }
    case 'oidc_role_arn':
      const conf = new Config({
        roleArn: config.role_arn,
        oidcProviderArn: config.oidc_provider_arn,
        oidcTokenFilePath: config.oidc_token_file_path
      });
      return new OidcRoleArnCredential(conf);
    case 'rsa_key_pair':
      return new RsaKeyPairCredential(config.public_key_id, config.private_key_file);
    case 'bearer':
      return new BearerTokenCredential(config.bearer_token);
    default:
      throw new Error('Invalid type option, support: access_key, sts, ecs_ram_role, ram_role_arn, oidc_role_arn, rsa_key_pair, bearer');
    }
  }
}