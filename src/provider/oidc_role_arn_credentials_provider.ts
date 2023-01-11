

import ICredential from '../icredential';

import OidcRoleArnCredential from '../oidc_role_arn_credential';
import Config from '../config';

export default {
  getCredential(): ICredential {
    if (process.env.ALIBABA_CLOUD_ROLE_ARN
      && process.env.ALIBABA_CLOUD_OIDC_PROVIDER_ARN
      && process.env.ALIBABA_CLOUD_OIDC_TOKEN_FILE) {
      return new OidcRoleArnCredential(new Config({}));
    }

    return null;
  }
}
