import * as $tea from '@alicloud/tea-typescript';

export default class Config extends $tea.Model {
  accessKeyId?: string;
  accessKeySecret?: string;
  securityToken?: string;
  bearerToken?: string;
  durationSeconds?: number;
  roleArn?: string;
  policy?: string;
  roleSessionExpiration?: number;
  roleSessionName?: string;
  publicKeyId?: string;
  privateKeyFile?: string;
  roleName?: string;
  credentialsURI?: string;
  oidcProviderArn: string;
  oidcTokenFilePath: string;
  type?: string;

  static names(): { [key: string]: string } {
    return {
      accessKeyId: 'accessKeyId',
      accessKeySecret: 'accessKeySecret',
      securityToken: 'securityToken',
      bearerToken: 'bearerToken',
      durationSeconds: 'durationSeconds',
      roleArn: 'roleArn',
      policy: 'policy',
      roleSessionExpiration: 'roleSessionExpiration',
      roleSessionName: 'roleSessionName',
      publicKeyId: 'publicKeyId',
      privateKeyFile: 'privateKeyFile',
      roleName: 'roleName',
      credentialsURI: 'credentialsURI',
      oidcProviderArn: 'oidcProviderArn',
      oidcTokenFilePath: 'oidcTokenFilePath',
      type: 'type',
    };
  }

  static types(): { [key: string]: any } {
    return {
      accessKeyId: 'string',
      accessKeySecret: 'string',
      securityToken: 'string',
      bearerToken: 'string',
      durationSeconds: 'number',
      roleArn: 'string',
      policy: 'string',
      roleSessionExpiration: 'number',
      roleSessionName: 'string',
      publicKeyId: 'string',
      privateKeyFile: 'string',
      roleName: 'string',
      credentialsURI: 'string',
      oidcProviderArn: 'string',
      oidcTokenFilePath: 'string',
      type: 'string',
    };
  }

  constructor(config?: { [key: string]: any }) {
    super(config);
  }
}