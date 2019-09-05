[English](README.md) | 简体中文

# Alibaba Cloud Credentials for nodejs
[![npm version](https://badge.fury.io/js/@alicloud%2fcredentials.svg)](https://badge.fury.io/js/@alicloud%2fcredentials.svg)
[![Travis Build Status](https://api.travis-ci.org/aliyun/credentials-nodejs.png?branch=master)](https://travis-ci.org/aliyun/credentials-nodejs)
[![Appveyor Build status](https://ci.appveyor.com/api/projects/status/m9wp3edgrt2c098a?svg=true)](https://ci.appveyor.com/project/aliyun/credentials-nodejs)
[![codecov](https://codecov.io/gh/aliyun/credentials-nodejs/branch/master/graph/badge.svg)](https://codecov.io/gh/aliyun/credentials-nodejs)
[![license](https://img.shields.io/github/license/mashape/apistatus.svg)](LICENSE)


![](https://aliyunsdk-pages.alicdn.com/icons/AlibabaCloud.svg)

Alibaba Cloud Credentials for nodejs 是帮助 nodejs 开发者管理凭据的工具。
                   
本文将介绍如何获取和使用 Alibaba Cloud Credentials for nodejs。

## 要求
- 请确保你的系统安装了不低于 8.5.0 版本的 nodejs 环境。

## 安装
使用 `npm` 下载安装

```sh
npm install @alicloud/credentials
```


##快速使用
在您开始之前，您需要注册阿里云帐户并获取您的[凭证](https://usercenter.console.aliyun.com/#/manage/ak)。

### 凭证类型

#### access_key
通过[用户信息管理][ak]设置 access_key，它们具有该账户完全的权限，请妥善保管。有时出于安全考虑，您不能把具有完全访问权限的主账户 AccessKey 交于一个项目的开发者使用，您可以[创建RAM子账户][ram]并为子账户[授权][permissions]，使用RAM子用户的 AccessKey 来进行API调用。
```js
const Credentials = require('@alicloud/credentials');
const config = {
	type:               "access_key",       // 凭证类型
	access_key_id: 	    "AccessKeyId",      // AccessKeyId
	access_key_secret:  "AccessKeySecret",  // AccessKeySecret
}
const cred = new Credentials(config);
let accessKeyId = cred.getAccessKeyId();
let accessKeySecret = cred.getAccessKeySecret();
let type = cred.getType();

```

#### sts
通过安全令牌服务（Security Token Service，简称 STS），申请临时安全凭证（Temporary Security Credentials，简称 TSC），创建临时安全凭证。
```js
const Credentials = require('@alicloud/credentials');
const config = {
	type:                   "sts",             // 凭证类型
	access_key_id:          "AccessKeyId",     // AccessKeyId
	access_key_secret:      "AccessKeySecret", // AccessKeySecret
	security_token:         "SecurityToken",   // STS Token
}
const cred = new Credentials(config);
let accessKeyId = cred.getAccessKeyId();
let accessKeySecret = cred.getAccessKeySecret();
let type = cred.getType();
```

#### ram_role_arn
通过指定[RAM角色][RAM Role]，让凭证自动申请维护 STS Token。你可以通过为 `Policy` 赋值来限制获取到的 STS Token 的权限。
```js
const Credentials = require('@alicloud/credentials');
const config = {
	type:                   "ram_role_arn",     // 凭证类型
	access_key_id:          "AccessKeyId",      // AccessKeyId
	access_key_secret:      "AccessKeySecret",  // AccessKeySecret
	role_arn:               "RoleArn",          // 格式: acs:ram::用户ID:role/角色名
	role_session_name:      "RoleSessionName",  // 角色会话名称
	policy:                 "Policy",           // 可选, 限制 STS Token 的权限
	role_session_expiration: 3600,              // 可选, 限制 STS Token 的有效时间
}
const cred = new Credentials(config);
let accessKeyId = await cred.getAccessKeyId();
let accessKeySecret = await cred.getAccessKeySecret();
let securityToken = await cred.getSecurityToken();
let type = cred.getType();
await cred.updateCreadential();

```

#### ecs_ram_role
通过指定角色名称，让凭证自动申请维护 STS Token
```js
const Credentials = require('@alicloud/credentials');
const config = {
	type:                 "ecs_ram_role",       // 凭证类型
	role_name:            "RoleName",           // 账户RoleName
}
const cred = new Credentials(config);
let accessKeyId = await cred.getAccessKeyId();
let accessKeySecret = await cred.getAccessKeySecret();
let securityToken = await cred.getSecurityToken();
let type = cred.getType();
await cred.updateCreadential();
```

#### rsa_key_pair
通过指定公钥ID和私钥文件，让凭证自动申请维护 AccessKey。仅支持日本站。 
By specifying the public key ID and the private key file, the credential will be able to automatically request maintenance of the AccessKey before sending the request. Only Japan station is supported. 
```js
const Credentials = require('@alicloud/credentials');
const config = {
	type:                     "rsa_key_pair",       // 凭证类型
	private_key_file:         "PrivateKeyFile",     // PrivateKey文件路径
	public_key_id:            "PublicKeyId",        // 账户PublicKeyId
}
const cred = new Credentials(config);
let accessKeyId = await cred.getAccessKeyId();
let accessKeySecret = await cred.getAccessKeySecret();
let securityToken = await cred.getSecurityToken();
let type = cred.getType();
await cred.updateCreadential();
```

#### bearer
如呼叫中心(CCC)需用此凭证，请自行申请维护 Bearer Token。
```js
const Credentials = require('@alicloud/credentials');
const config = {
	type:                 "bearer",            // 凭证类型
	bearer_token:         "BearerToken",    // BearerToken
}
const cred = new Credentials(config);
let bearerToken = cred.getBearerToken();
let type = cred.getType();
```

### 凭证提供程序链
如果你调用 `New Credential()` 时传入空， 将通过凭证提供链来为你获取凭证。

#### 1. 环境凭证
程序首先会在环境变量里寻找环境凭证，如果定义了 `ALICLOUD_ACCESS_KEY`  和 `ALICLOUD_SECRET_KEY` 环境变量且不为空，程序将使用他们创建凭证。如否则，程序会在配置文件中加载和寻找凭证。

#### 2. 配置文件
如果用户主目录存在默认文件 `~/.alibabacloud/credentials` （Windows 为 `C:\Users\USER_NAME\.alibabacloud\credentials`），程序会自动创建指定类型和名称的凭证。默认文件可以不存在，但解析错误会抛出异常。也可以手动加载指定文件： `AlibabaCloud::load('/data/credentials', 'vfs://AlibabaCloud/credentials', ...);` 不同的项目、工具之间可以共用这个配置文件，因为超出项目之外，也不会被意外提交到版本控制。Windows 上可以使用环境变量引用到主目录 %UserProfile%。类 Unix 的系统可以使用环境变量 $HOME 或 ~ (tilde)。 可以通过定义 `ALIBABA_CLOUD_CREDENTIALS_FILE` 环境变量修改默认文件的路径。

```ini
[default]                          # 默认凭证
type = access_key                  # 认证方式为 access_key
access_key_id = foo                # access key id
access_key_secret = bar            # access key secret
```

#### 3. 实例 RAM 角色
如果定义了环境变量 `ALIBABA_CLOUD_ECS_METADATA` 且不为空，程序会将该环境变量的值作为角色名称，请求 `http://100.100.100.200/latest/meta-data/ram/security-credentials/` 获取临时安全凭证。


[ak]: https://usercenter.console.aliyun.com/#/manage/ak
[ram]: https://ram.console.aliyun.com/users
[policy]: https://www.alibabacloud.com/help/doc-detail/28664.htm?spm=a2c63.p38356.a3.3.27a63b01khWgdh
[permissions]: https://ram.console.aliyun.com/permissions
[RAM Role]: https://ram.console.aliyun.com/#/role/list