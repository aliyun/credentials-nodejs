English | [简体中文](README-CN.md)

# Alibaba Cloud Credentials for TypeScript/Node.js

[![npm version](https://badge.fury.io/js/@alicloud%2fcredentials.svg)](https://www.npmjs.com/package/@alicloud/credentials)
[![NodeJS](https://github.com/aliyun/credentials-nodejs/actions/workflows/cli.yml/badge.svg)](https://github.com/aliyun/credentials-nodejs/actions/workflows/cli.yml)
[![codecov](https://codecov.io/gh/aliyun/credentials-nodejs/branch/master/graph/badge.svg)](https://codecov.io/gh/aliyun/credentials-nodejs)
[![license](https://img.shields.io/github/license/mashape/apistatus.svg)](LICENSE)

## Installation

```bash
npm install @alicloud/credentials
```

**Node.js >= 8.5.0** required.

## Quick Examples

Before you begin, you need to sign up for an Alibaba Cloud account and retrieve your [Credentials](https://usercenter.console.aliyun.com/#/manage/ak).

### Credential Type

#### access_key

Setup access_key credential through [User Information Management][ak], it have full authority over the account, please keep it safe. Sometimes for security reasons, you cannot hand over a primary account AccessKey with full access to the developer of a project. You may create a sub-account [RAM Sub-account][ram] , grant its [authorization][permissions]，and use the AccessKey of RAM Sub-account.

```ts
import Credential, { Config } from '@alicloud/credentials';
const config: Config = {
  type:               'access_key',       // credential type
  accessKeyId:        'accessKeyId',      // AccessKeyId of your account
  accessKeySecret:    'accessKeySecret',  // AccessKeySecret of your account
}
const cred = new Credential(config);
let accessKeyId: string = await cred.getAccessKeyId();
let accessKeySecret: string = await cred.getAccessKeySecret();
let type: string = cred.getType();
  
```

#### sts

Create a temporary security credential by applying Temporary Security Credentials (TSC) through the Security Token Service (STS).

```ts
import Credential, { Config } from '@alicloud/credentials';
const config: Config = {
  type:                  'sts',             // credential type
  accessKeyId:           'accessKeyId',     // AccessKeyId of your account
  accessKeySecret:       'accessKeySecret', // AccessKeySecret of your account
  securityToken:         'securityToken',   // Temporary Security Token
}
const cred = new Credential(config);
let accessKeyId: string = await cred.getAccessKeyId();
let accessKeySecret: string = await cred.getAccessKeySecret();
let type: string = cred.getType();
```

#### ram_role_arn

By specifying [RAM Role][RAM Role], the credential will be able to automatically request maintenance of STS Token. If you want to limit the permissions([How to make a policy][policy]) of STS Token, you can assign value for `Policy`.

```ts
import Credential, { Config } from '@alicloud/credentials';
const config: Config = {
  type:                 'ram_role_arn',     // credential type
  accessKeyId:          'accessKeyId',      // AccessKeyId of your account
  accessKeySecret:      'accessKeySecret',  // AccessKeySecret of your account
  roleArn:              'roleArn',          // Format: acs:ram::USER_ID:role/ROLE_NAME
  roleSessionName:      'roleSessionName',  // Role Session Name
  policy:               'policy',           // Not required, limit the permissions of STS Token
  roleSessionExpiration: 3600,              // Not required, limit the Valid time of STS Token
}
const cred = new Credential(config);
let accessKeyId: string = await cred.getAccessKeyId();
let accessKeySecret: string = await cred.getAccessKeySecret();
let securityToken: string = await cred.getSecurityToken();
let type: string = cred.getType();
```

#### oidc_role_arn

By specifying [OIDC Role][OIDC Role], the credential will be able to automatically request maintenance of STS Token. If you want to limit the permissions([How to make a policy][policy]) of STS Token, you can assign value for `Policy`.

```ts
import Credential, { Config } from '@alicloud/credentials';
const config: Config = {
  type:                   'oidc_role_arn',    // credential type
  roleArn:                'roleArn',          // Format: acs:ram::USER_Id:role/ROLE_NAME roleArn can be replaced by setting environment variable: ALIBABA_CLOUD_ROLE_ARN
  oidcProviderArn:        'oidcProviderArn',  // Format: acs:ram::USER_Id:oidc-provider/ROLE_NAME oidcProviderArn can be replaced by setting environment variable: ALIBABA_CLOUD_OIDC_PROVIDER_ARN
  oidcTokenFilePath:      '/Users/xxx/xxx',   // Format: path  OIDCTokenFilePath can be replaced by setting environment variable: ALIBABA_CLOUD_OIDC_TOKEN_FILE
  roleSessionName:        'roleSessionName',  // Role Session Name
  policy:                 'policy',           // Not required, limit the permissions of STS Token
  roleSessionExpiration:   3600,              // Not required, limit the Valid time of STS Token
}
const cred = new Credential(config);
let accessKeyId: string = await cred.getAccessKeyId();
let accessKeySecret: string = await cred.getAccessKeySecret();
let securityToken: string = await cred.getSecurityToken();
let type: string = cred.getType();
```

#### ecs_ram_role

By specifying the role name, the credential will be able to automatically request maintenance of STS Token.

```ts
import Credential, { Config } from '@alicloud/credentials';
const config: Config = {
  type:                 'ecs_ram_role',       // credential type
  roleName:             'roleName',           // `roleName` is optional. It will be retrieved automatically if not set. It is highly recommended to set it up to reduce requests.
}
const cred = new Credential(config);
let accessKeyId: string = await cred.getAccessKeyId();
let accessKeySecret: string = await cred.getAccessKeySecret();
let securityToken: string = await cred.getSecurityToken();
let type: string = cred.getType();
```

#### rsa_key_pair

By specifying the public key ID and the private key file, the credential will be able to automatically request maintenance of the AccessKey before sending the request. Only Japan station is supported.

```ts
import Credential, { Config } from '@alicloud/credentials';
const config: Config = {
  type:                     'rsa_key_pair',       // credential type
  privateKeyFile:           'privateKeyFile',     // The file path to store the PrivateKey
  publicKeyId:              'publicKeyId',        // PublicKeyId of your account
}
const cred = new Credential(config);
let accessKeyId: string = await cred.getAccessKeyId();
let accessKeySecret: string = await cred.getAccessKeySecret();
let securityToken: string = await cred.getSecurityToken();
let type: string = cred.getType();
```

#### credentials_uri

By specifying a local or remote URI to get credentials and refresh automanticly.

```ts
import Credential, { Config } from '@alicloud/credentials';
const config: Config = {
  type: 'credentials_uri',
  credentialsURI: 'http://a_local_or_remote_address/'  //credentialsURI can be replaced by setting environment variable: ALIBABA_CLOUD_CREDENTIALS_URI
};
const cred = new Credential(config);
let accessKeyId: string = await cred.getAccessKeyId();
let accessKeySecret: string = await cred.getAccessKeySecret();
let securityToken: string = await cred.getSecurityToken();
let type: string = cred.getType();
```

The URI must reponse meets following conditions:

- response status code is 200
- response body struct must be:

```json
{
  "Code": "Success",
  "AccessKeySecret": "AccessKeySecret",
  "AccessKeyId": "AccessKeyId",
  "Expiration": "2021-09-26T03:46:38Z",
  "SecurityToken": "SecurityToken"
}
```

#### bearer

If credential is required by the Cloud Call Centre (CCC), please apply for Bearer Token maintenance by yourself.

```ts
import Credential, { Config } from '@alicloud/credentials';
const config: Config = {
  type:                 'bearer',            // credential type
  bearerToken:          'bearerToken',       // BearerToken of your account
}
const cred = new Credential(config);
let bearerToken: string = await cred.getBearerToken();
let type: string = cred.getType();
```

### Provider

If you call `new Credential()` with empty, it will use provider chain to get credential for you.

#### 1. Environment Credentials

The program first looks for environment credentials in the environment variable. If the `ALIBABA_CLOUD_ACCESS_KEY_ID` and `ALIBABA_CLOUD_ACCESS_KEY_SECRET` environment variables are defined and are not empty, the program will use them to create the default credential. If not, the program loads and looks for the client in the configuration file.

#### 2. Config File

If there is `~/.alibabacloud/credentials` default file (Windows shows `C:\Users\USER_NAME\.alibabacloud\credentials`), the program will automatically create credential with the name of 'default'. The default file may not exist, but a parse error throws an exception. The specified files can also be loaded indefinitely: `AlibabaCloud::load('/data/credentials', 'vfs://AlibabaCloud/credentials', ...);` This configuration file can be shared between different projects and between different tools. Because it is outside the project and will not be accidentally committed to the version control. Environment variables can be used on Windows to refer to the home directory %UserProfile%. Unix-like systems can use the environment variable $HOME or ~ (tilde). The path to the default file can be modified by defining the `ALIBABA_CLOUD_CREDENTIALS_FILE` environment variable.

```ini
[default]                          # Default credential
type = access_key                  # Certification type: access_key
access_key_id = foo                # access key id
access_key_secret = bar            # access key secret
```

#### 3. Instance RAM Role

If the environment variable `ALIBABA_CLOUD_ECS_METADATA` is defined and not empty, the program will take the value of the environment variable as the role name and request `http://100.100.100.200/latest/meta-data/ram/security-credentials/` to get the temporary Security credential.

#### 4. Credentials URI

If the environment variable `ALIBABA_CLOUD_CREDENTIALS_URI` is defined and not empty,
the program will take the value of the environment variable as the credentials uri.

## Test & Coverage

- run test

```
npm run test
```

- run code coverage

```
npm run cov
```

## License

[MIT](LICENSE)

Copyright (c) 2009-present, Alibaba Cloud All rights reserved.

[ak]: https://usercenter.console.aliyun.com/#/manage/ak
[ram]: https://ram.console.aliyun.com/users
[permissions]: https://ram.console.aliyun.com/permissions
[RAM Role]: https://ram.console.aliyun.com/#/role/list
