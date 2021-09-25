import httpx from 'httpx';

import Config from './config';
import ICredential from './icredential';
import SessionCredential from './session_credential';

export default class URICredential extends SessionCredential implements ICredential {
  credentialsURI: string;

  constructor(uri: string) {
    if (!uri) {
      throw new Error('Missing required credentialsURI option in config for credentials_uri');
    }

    const conf = new Config({
      type: 'credentials_uri',
      credentialsURI: uri
    });

    super(conf);
    this.credentialsURI = uri;
  }

  async updateCredential(): Promise<void> {
    const url = this.credentialsURI;
    const response = await httpx.request(url, {});
    if (response.statusCode !== 200) {
      throw new Error(`Get credentials from ${url} failed, status code is ${response.statusCode}`);
    }
    const body = (await httpx.read(response, 'utf8')) as string;
    let json;
    try {
      json = JSON.parse(body);
    } catch (ex) {
      throw new Error(`Get credentials from ${url} failed, unmarshal response failed, JSON is: ${body}`);
    }

    if (json.Code !== 'Success') {
      throw new Error(`Get credentials from ${url} failed, Code is ${json.Code}`);
    }
  
    this.sessionCredential = {
      AccessKeyId: json.AccessKeyId,
      AccessKeySecret: json.AccessKeySecret,
      Expiration: json.Expiration,
      SecurityToken: json.SecurityToken,
    };
  }
}
