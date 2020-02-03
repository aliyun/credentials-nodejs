import DefaultCredential from './default_credential';
import ICredential from './icredential';

export default class AccessKeyCredential extends DefaultCredential implements ICredential {
  constructor(accessKeyId: string, accessKeySecret: string) {
    if (!accessKeyId) {
      throw new Error('Missing required accessKeyId option in config for access_key');
    }
    if (!accessKeySecret) {
      throw new Error('Missing required accessKeySecret option in config for access_key');
    }

    super({
      type: 'access_key',
      accessKeyId,
      accessKeySecret
    });
  }
}
