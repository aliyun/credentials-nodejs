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
  enableIMDSv2?: boolean;
  disableIMDSv1: boolean;
  asyncCredentialUpdateEnabled: boolean;
  metadataTokenDuration?: number;
  credentialsURI?: string;
  oidcProviderArn: string;
  oidcTokenFilePath: string;
  type?: string;
  externalId?: string;
  stsEndpoint?: string;
  timeout?: number;
  connectTimeout?: number;

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
      externalId: 'externalId',
      stsEndpoint: 'stsEndpoint',
      stsRegionId: 'stsRegionId',
      enableVpc: 'enableVpc',
      timeout: 'readTimeout',
      connectTimeout: 'connectTimeout',
      publicKeyId: 'publicKeyId',
      privateKeyFile: 'privateKeyFile',
      roleName: 'roleName',
      enableIMDSv2: 'enableIMDSv2',
      disableIMDSv1: 'disableIMDSv1',
      asyncCredentialUpdateEnabled: 'asyncCredentialUpdateEnabled',
      metadataTokenDuration: 'metadataTokenDuration',
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
      externalId: 'string',
      stsEndpoint: 'string',
      stsRegionId: 'string',
      enableVpc: 'string',
      timeout: 'number',
      connectTimeout: 'number',
      publicKeyId: 'string',
      privateKeyFile: 'string',
      roleName: 'string',
      enableIMDSv2: 'boolean',
      disableIMDSv1: 'boolean',
      asyncCredentialUpdateEnabled: 'boolean',
      metadataTokenDuration: 'number',
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