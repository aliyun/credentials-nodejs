import DefaultCredential from './default_credential';
import ICredential from './icredential';
import Config from './config';

export default class BearerTokenCredential extends DefaultCredential implements ICredential {

  constructor(bearerToken: string) {
    if (!bearerToken) {
      throw new Error('Missing required bearerToken option in config for bearer');
    }
    const conf = new Config({
      type: 'bearer'
    });
    super(conf);
    this.bearerToken = bearerToken;
  }
}