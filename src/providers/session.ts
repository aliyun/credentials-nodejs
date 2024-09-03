export default class Session {
  accessKeyId: string;
  accessKeySecret: string;
  securityToken: string;
  expiration: string;

  constructor(accessKeyId: string, accessKeySecret: string, securityToken: string, expiration: string) {
    this.accessKeyId = accessKeyId;
    this.accessKeySecret = accessKeySecret;
    this.securityToken = securityToken;
    this.expiration = expiration;
  }
}
