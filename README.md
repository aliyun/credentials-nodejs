# Alibaba Cloud Node.js Credentials SDK

[![npm version](https://badge.fury.io/js/@alicloud%2fcredentials.svg)](https://badge.fury.io/js/@alicloud%2fcredentials.svg)
[![Travis Build Status](https://api.travis-ci.org/aliyun/nodejs-credentials.png?branch=master)](https://travis-ci.org/aliyun/nodejs-credentials)
[![Appveyor Build status](https://ci.appveyor.com/api/projects/status/m9wp3edgrt2c098a?svg=true)](https://ci.appveyor.com/project/hyj1991/nodejs-credentials)
[![codecov](https://codecov.io/gh/aliyun/nodejs-credentials/branch/master/graph/badge.svg)](https://codecov.io/gh/aliyun/nodejs-credentials)
[![license](https://img.shields.io/github/license/mashape/apistatus.svg)](LICENSE)

## Installation

```bash
npm install @alicloud/credentials
```

**Node.js >= 8.5.0** required.

## Usage

### I. Use accessKeyId & accessKeySecret

```bash
ALIBABA_CLOUD_ACCESS_KEY_ID=<your access key id> ALIBABA_CLOUD_ACCESS_KEY_SECRET=<your access key secret> node app.js
```

### II. Use credentials file

#### Write credentials file

First you should write credentials file at your home dir: **~/.alibabacloud/credentials**.

Credentials file example :

```bash
# ~/.alibabacloud/credentials
[default]
enable = true
type = access_key
access_key_id = ******
access_key_secret = ******

[kms-demo]
enable = true
type = ram_role_arn
access_key_id = ******
access_key_secret = ******
role_arn = acs:ram::******:role/******
role_session_name = ******
```

#### Write code

Then this module will automatically load credentials from the credentials file above.

Code example:

```js
const KmsClient = require('@alicloud/kms-sdk');
const Credentials = require('@alicloud/credentials');
const client = new KmsClient({
  endpoint: 'kms.cn-hangzhou.aliyuncs.com', // check this from kms console
  credential: new Credentials({ profile: 'kms-demo' })
});
```

You can also use custom credential path like:

```bash
ALIBABA_CLOUD_CREDENTIALS_FILE=/path/to/your/credential node app.js
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