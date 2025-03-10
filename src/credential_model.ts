import * as $tea from '@alicloud/tea-typescript';

export default class CredentialModel extends $tea.Model {
  accessKeyId?: string;
  accessKeySecret?: string;
  securityToken?: string;
  bearerToken?: string;
  type?: string;
  providerName?: string;
  static names(): { [key: string]: string } {
    return {
      accessKeyId: 'accessKeyId',
      accessKeySecret: 'accessKeySecret',
      securityToken: 'securityToken',
      bearerToken: 'bearerToken',
      type: 'type',
      providerName: 'providerName',
    };
  }

  static types(): { [key: string]: any } {
    return {
      accessKeyId: 'string',
      accessKeySecret: 'string',
      securityToken: 'string',
      bearerToken: 'string',
      type: 'string',
      providerName: 'string',
    };
  }

  constructor(map?: { [key: string]: any }) {
    super(map);
  }
}