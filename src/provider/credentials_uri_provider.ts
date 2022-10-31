import URICredential from '../uri_credential';
import ICredential from '../icredential';

export default {
  getCredential(): ICredential {
    const credentialsURI = process.env.ALIBABA_CLOUD_CREDENTIALS_URI;
    if (credentialsURI) {
      return new URICredential(credentialsURI);
    }

    return null;
  }
}
