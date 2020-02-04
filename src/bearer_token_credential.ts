import DefaultCredential from './default_credential';
import ICredential from './icredential';

export default class BearerTokenCredential extends DefaultCredential implements ICredential {
  bearerToken: string;

  constructor(bearerToken: string) {
    if (!bearerToken) {
      throw new Error('Missing required bearerToken option in config for bearer');
    }
    super({
      type: 'bearer'
    });
    this.bearerToken = bearerToken;
  }

  getBearerToken(): string {
    return this.bearerToken;
  }
}
