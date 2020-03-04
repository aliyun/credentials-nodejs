import DefaultCredential from './default_credential';
import ICredential from './icredential';
import Config from './config';

export default class AccessKeyCredential extends DefaultCredential implements ICredential {
  constructor(accessKeyId: string, accessKeySecret: string) {
    if (!accessKeyId) {
      throw new Error('Missing required accessKeyId option in config for access_key');
    }

    if (!accessKeySecret) {
      throw new Error('Missing required accessKeySecret option in config for access_key');
    }
    const conf = new Config({
      type: 'access_key',
      accessKeyId,
      accessKeySecret
    });
    super(conf);
  }
}