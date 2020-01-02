English | [简体中文](README-CN.md)
# Alibaba Cloud Credentials for Nodejs

[![npm version](https://badge.fury.io/js/@alicloud%2fcredentials.svg)](https://badge.fury.io/js/@alicloud%2fcredentials.svg)
[![Travis Build Status](https://api.travis-ci.org/aliyun/credentials-nodejs.svg?branch=master)](https://travis-ci.org/aliyun/credentials-nodejs)
[![Appveyor Build status](https://ci.appveyor.com/api/projects/status/m9wp3edgrt2c098a?svg=true)](https://ci.appveyor.com/project/aliyun/credentials-nodejs)
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
```js
const Credentials = require('@alicloud/credentials');
const config = {
	type:               'access_key',       // credential type
	accessKeyId: 	    'accessKeyId',      // AccessKeyId of your account
	accessKeySecret:    'accessKeySecret',  // AccessKeySecret of your account
}
const cred = new Credentials(config);
let accessKeyId = await cred.getAccessKeyId();
let accessKeySecret = await cred.getAccessKeySecret();
let type = cred.getType();
	
```

#### sts
Create a temporary security credential by applying Temporary Security Credentials (TSC) through the Security Token Service (STS).
```js
const Credentials = require('@alicloud/credentials');
const config = {
	type:                  'sts',             // credential type
	accessKeyId:           'accessKeyId',     // AccessKeyId of your account
	accessKeySecret:       'accessKeySecret', // AccessKeySecret of your account
	securityToken:         'securityToken',   // Temporary Security Token
}
const cred = new Credentials(config);
let accessKeyId = await cred.getAccessKeyId();
let accessKeySecret = await cred.getAccessKeySecret();
let type = cred.getType();
```

#### ram_role_arn
By specifying [RAM Role][RAM Role], the credential will be able to automatically request maintenance of STS Token. If you want to limit the permissions([How to make a policy][policy]) of STS Token, you can assign value for `Policy`.
```js
const Credentials = require('@alicloud/credentials');
const config = {
	type:                 'ram_role_arn',     // credential type
	accessKeyId:          'accessKeyId',      // AccessKeyId of your account
	accessKeySecret:      'accessKeySecret',  // AccessKeySecret of your account
	roleArn:              'roleArn',          // Format: acs:ram::USER_ID:role/ROLE_NAME
	roleSessionName:      'roleSessionName',  // Role Session Name
	policy:               'policy',           // Not required, limit the permissions of STS Token
	roleSessionExpiration: 3600,              // Not required, limit the Valid time of STS Token
}
const cred = new Credentials(config);
let accessKeyId = await cred.getAccessKeyId();
let accessKeySecret = await cred.getAccessKeySecret();
let securityToken = await cred.getSecurityToken();
let type = cred.getType();
```

#### ecs_ram_role
By specifying the role name, the credential will be able to automatically request maintenance of STS Token.
```js
const Credentials = require('@alicloud/credentials');
const config = {
	type:                 'ecs_ram_role',       // credential type
	roleName:             'roleName',           // `roleName` is optional. It will be retrieved automatically if not set. It is highly recommended to set it up to reduce requests.
}
const cred = new Credentials(config);
let accessKeyId = await cred.getAccessKeyId();
let accessKeySecret = await cred.getAccessKeySecret();
let securityToken = await cred.getSecurityToken();
let type = cred.getType();
```

#### rsa_key_pair
By specifying the public key ID and the private key file, the credential will be able to automatically request maintenance of the AccessKey before sending the request. Only Japan station is supported. 
```js
const Credentials = require('@alicloud/credentials');
const config = {
	type:                     'rsa_key_pair',       // credential type
	privateKeyFile:           'privateKeyFile',     // The file path to store the PrivateKey
	publicKeyId:              'publicKeyId',        // PublicKeyId of your account
}
const cred = new Credentials(config);
let accessKeyId = await cred.getAccessKeyId();
let accessKeySecret = await cred.getAccessKeySecret();
let securityToken = await cred.getSecurityToken();
let type = cred.getType();
```

#### bearer
If credential is required by the Cloud Call Centre (CCC), please apply for Bearer Token maintenance by yourself.
```js
const Credentials = require('@alicloud/credentials');
const config = {
	type:                 'bearer',            // credential type
	bearerToken:          'bearerToken',       // BearerToken of your account
}
const cred = new Credentials(config);
let bearerToken = await cred.getBearerToken();
let type = cred.getType();
```


## Test & Coverage

* run test

```
npm run test
```

* run code coverage

```
npm run cov
```


## License

[MIT](LICENSE)

Copyright (c) 2009-present, Alibaba Cloud All rights reserved.