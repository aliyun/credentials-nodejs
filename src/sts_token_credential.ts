import DefaultCredential from './default_credential';
import ICredential from './icredential';
import Config from './config';

export default class StsTokenCredential extends DefaultCredential implements ICredential {
  constructor(accessKeyId: string, accessKeySecret: string, securityToken: string) {
    if (!accessKeyId) {
      throw new Error('Missing required accessKeyId option in config for sts');
    }

    if (!accessKeySecret) {
      throw new Error('Missing required accessKeySecret option in config for sts');
    }

    if (!securityToken) {
      throw new Error('Missing required securityToken option in config for sts');
    }
    const conf = new Config({
      type: 'sts',
      accessKeyId,
      accessKeySecret,
      securityToken
    });
    super(conf);
  }
}
