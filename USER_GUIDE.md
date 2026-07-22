# Alibaba Cloud Credentials for Node.js - 用户使用指南

## 1. 项目简介

Alibaba Cloud Credentials for Node.js 是阿里云官方提供的 TypeScript/Node.js 凭证管理 SDK，用于帮助开发者安全、便捷地管理访问阿里云服务所需的身份凭证。

### 核心能力

- **多种凭证类型支持**：支持 AccessKey、STS Token、RAM 角色、OIDC、RSA 密钥对、Bearer Token 等多种认证方式
- **自动凭证刷新**：对于临时凭证（如 STS Token），SDK 会自动管理凭证的刷新，无需手动处理过期问题
- **凭证提供链（Provider Chain）**：支持按优先级自动从多个来源获取凭证（环境变量、配置文件、实例元数据服务等）
- **安全性保障**：支持 IMDSv2（Instance Metadata Service v2）以提高 ECS 实例凭证获取的安全性

### 典型应用场景

- 在本地开发环境中通过 AccessKey 访问阿里云服务
- 在 ECS 实例上通过 RAM 角色自动获取临时凭证
- 使用 STS 临时凭证实现临时授权访问
- 在 CI/CD 流水线中通过 OIDC 进行无密钥认证
- 跨账号访问场景下使用 RAM 角色扮演（AssumeRole）

---

## 2. 使用前提与环境要求

### 操作系统要求

本 SDK 支持以下操作系统：
- **Linux**（主流发行版，如 Ubuntu 18.04+、CentOS 7+、Debian 9+ 等）
- **macOS**（macOS 10.14+ 及更高版本）
- **Windows**（Windows 10、Windows Server 2016+ 及更高版本）

### 运行时环境

- **Node.js 版本**：**>= 12.0.0**（必需）
  - 推荐使用 LTS 版本（如 12.x、14.x、16.x、18.x、20.x）
  - 可通过 `node -v` 命令检查当前 Node.js 版本
  
- **npm/yarn**：用于安装依赖包
  - npm >= 6.0（通常随 Node.js 一起安装）
  - 或使用 yarn >= 1.0

### 系统依赖

- **网络访问**：
  - 需要访问阿里云 STS 服务（`sts.aliyuncs.com` 或指定区域的 STS 端点）
  - 在 ECS 实例上使用 RAM 角色时，需要访问 `http://100.100.100.200`（实例元数据服务）
  - 使用 credentials_uri 类型时，需要访问指定的 URI 地址

- **文件系统权限**：
  - 使用配置文件（`~/.alibabacloud/credentials` 或 `~/.aliyun/config.json`）时，需要读取权限
  - 使用 RSA 密钥对时，需要对私钥文件的读取权限

### 权限要求

- **RAM 权限**：
  - 使用 AccessKey 时，需要确保该 AccessKey 具有调用目标阿里云服务的 RAM 权限
  - 使用 RAM 角色扮演时，需要确保当前身份有权限扮演目标角色（`sts:AssumeRole` 权限）
  - 使用 ECS RAM 角色时，需要在 ECS 实例上绑定 RAM 角色

- **API 密钥**：
  - AccessKey ID 和 AccessKey Secret 可在阿里云控制台获取
  - 建议使用 RAM 子账号的 AccessKey，避免使用主账号 AccessKey

### 特殊说明

- **ECS 实例元数据服务**：在阿里云 ECS 实例上使用 RAM 角色时，无需额外配置，SDK 会自动从实例元数据服务获取凭证
- **OIDC 认证**：需要预先在阿里云 RAM 控制台配置 OIDC 身份提供商和 RAM 角色信任策略

---

## 3. 快速开始指南

### 安装

使用 npm 安装：

```bash
npm install @alicloud/credentials
```

使用 yarn 安装：

```bash
yarn add @alicloud/credentials
```

### 基本使用示例

#### 示例 1：使用 AccessKey 认证

```typescript
import Credential, { Config } from '@alicloud/credentials';

const config: Config = {
  type: 'access_key',
  accessKeyId: 'your-access-key-id',
  accessKeySecret: 'your-access-key-secret',
};

const cred = new Credential(config);
const credentialModel = await cred.getCredential();

console.log('AccessKeyId:', credentialModel.accessKeyId);
console.log('AccessKeySecret:', credentialModel.accessKeySecret);
```

**预期输出**：
```
AccessKeyId: your-access-key-id
AccessKeySecret: your-access-key-secret
```

#### 示例 2：使用默认凭证提供链

```typescript
import Credential from '@alicloud/credentials';

// 不传入任何配置，SDK 会按优先级自动从多个来源获取凭证
const cred = new Credential();
const credentialModel = await cred.getCredential();

console.log('Type:', credentialModel.type);
console.log('Provider:', credentialModel.providerName);
```

**预期输出**（假设从环境变量获取）：
```
Type: access_key
Provider: default/env
```

### 配置说明

#### 使用环境变量配置

SDK 支持通过环境变量配置凭证，无需在代码中硬编码敏感信息：

```bash
# AccessKey 方式
export ALIBABA_CLOUD_ACCESS_KEY_ID="your-access-key-id"
export ALIBABA_CLOUD_ACCESS_KEY_SECRET="your-access-key-secret"

# STS Token 方式（可选）
export ALIBABA_CLOUD_SECURITY_TOKEN="your-security-token"

# ECS RAM 角色方式
export ALIBABA_CLOUD_ECS_METADATA="your-role-name"

# OIDC 方式
export ALIBABA_CLOUD_ROLE_ARN="acs:ram::123456789012:role/your-role"
export ALIBABA_CLOUD_OIDC_PROVIDER_ARN="acs:ram::123456789012:oidc-provider/your-provider"
export ALIBABA_CLOUD_OIDC_TOKEN_FILE="/path/to/oidc/token"

# 凭证 URI 方式
export ALIBABA_CLOUD_CREDENTIALS_URI="http://your-credential-server/"

# 配置文件路径（可选）
export ALIBABA_CLOUD_CREDENTIALS_FILE="~/.alibabacloud/credentials"
export ALIBABA_CLOUD_PROFILE="default"
```

#### 使用配置文件

在用户主目录创建 `~/.alibabacloud/credentials` 文件：

```ini
[default]
type = access_key
access_key_id = your-access-key-id
access_key_secret = your-access-key-secret

[production]
type = ram_role_arn
access_key_id = your-access-key-id
access_key_secret = your-access-key-secret
role_arn = acs:ram::123456789012:role/your-role
role_session_name = session-name
```

使用指定的配置：

```typescript
import { ProfileCredentialsProvider } from '@alicloud/credentials';

const provider = ProfileCredentialsProvider.builder()
  .withProfileName('production')
  .build();

const credentials = await provider.getCredentials();
```

### 启动与验证

创建测试文件 `test-credentials.ts`：

```typescript
import Credential from '@alicloud/credentials';

async function main() {
  try {
    const cred = new Credential();
    const credentialModel = await cred.getCredential();
    
    console.log('✓ Credentials loaded successfully!');
    console.log('  Type:', credentialModel.type);
    console.log('  Provider:', credentialModel.providerName);
    console.log('  AccessKeyId:', credentialModel.accessKeyId.substring(0, 8) + '****');
  } catch (error) {
    console.error('✗ Failed to load credentials:', error.message);
    process.exit(1);
  }
}

main();
```

运行验证：

```bash
npx ts-node test-credentials.ts
```

**成功输出示例**：
```
✓ Credentials loaded successfully!
  Type: access_key
  Provider: default/env
  AccessKeyId: LTAI****
```

---

## 4. 常见问题解答（FAQ）

### 4.1 凭证配置相关问题

#### Q1: 错误信息：`Missing required type option`

**问题现象**：
```
Error: Missing required type option
```

**根本原因**：
在创建 `Credential` 时传入了 `Config` 对象，但未指定 `type` 字段。SDK 要求必须明确指定凭证类型（如 `access_key`、`sts`、`ecs_ram_role` 等）。

**解决方案**：
```typescript
// ❌ 错误示例
const config: Config = {
  accessKeyId: 'xxx',
  accessKeySecret: 'xxx'
  // 缺少 type 字段
};

// ✅ 正确示例
const config: Config = {
  type: 'access_key',  // 必须指定类型
  accessKeyId: 'xxx',
  accessKeySecret: 'xxx'
};
```

#### Q2: 错误信息：`Invalid type option, support: access_key, sts, ecs_ram_role, ram_role_arn, rsa_key_pair, credentials_uri`

**问题现象**：
```
Error: Invalid type option, support: access_key, sts, ecs_ram_role, ram_role_arn, rsa_key_pair, credentials_uri
```

**根本原因**：
指定的 `type` 值不在 SDK 支持的凭证类型列表中。可能的原因包括：
- 拼写错误（如 `access-key` 写成了 `accesskey`）
- 使用了不存在的类型名称

**解决方案**：
使用以下任一有效的凭证类型：
- `access_key` - AccessKey 认证
- `sts` - STS Token 认证
- `ecs_ram_role` - ECS RAM 角色
- `ram_role_arn` - RAM 角色扮演
- `oidc_role_arn` - OIDC 角色扮演
- `rsa_key_pair` - RSA 密钥对（仅日本站支持）
- `bearer` - Bearer Token
- `credentials_uri` - 从 URI 获取凭证

#### Q3: 错误信息：`Missing required accessKeyId option in config for access_key`

**问题现象**：
```
Error: Missing required accessKeyId option in config for access_key
```

**根本原因**：
使用 `access_key` 类型时，未提供必需的 `accessKeyId` 字段，或该字段为空字符串。

**解决方案**：
```typescript
const config: Config = {
  type: 'access_key',
  accessKeyId: 'LTAI******************',      // 必填
  accessKeySecret: 'your-access-key-secret'   // 必填
};
```

确保 AccessKey ID 和 Secret 均已正确填写且不为空。

#### Q4: 错误信息：`Missing required accessKeySecret option in config for access_key`

**问题现象**：
```
Error: Missing required accessKeySecret option in config for access_key
```

**根本原因**：
使用 `access_key` 类型时，未提供必需的 `accessKeySecret` 字段，或该字段为空。

**解决方案**：
确保同时提供 `accessKeyId` 和 `accessKeySecret`：
```typescript
const config: Config = {
  type: 'access_key',
  accessKeyId: 'your-access-key-id',
  accessKeySecret: 'your-access-key-secret'  // 不能为空
};
```

### 4.2 STS Token 相关问题

#### Q5: 错误信息：`Missing required securityToken option in config for sts`

**问题现象**：
```
Error: Missing required securityToken option in config for sts
```

**根本原因**：
使用 `sts` 类型时，必须同时提供 `accessKeyId`、`accessKeySecret` 和 `securityToken` 三个字段。

**解决方案**：
```typescript
const config: Config = {
  type: 'sts',
  accessKeyId: 'STS.***',
  accessKeySecret: 'secret',
  securityToken: 'your-security-token'  // 必填
};
```

### 4.3 RAM 角色相关问题

#### Q6: 错误信息：`Missing required roleArn option in config for ram_role_arn`

**问题现象**：
```
Error: Missing required roleArn option in config for ram_role_arn
```

**根本原因**：
使用 `ram_role_arn` 类型时，未提供必需的 `roleArn` 字段。

**解决方案**：
```typescript
const config: Config = {
  type: 'ram_role_arn',
  accessKeyId: 'your-access-key-id',
  accessKeySecret: 'your-access-key-secret',
  roleArn: 'acs:ram::123456789012:role/YourRoleName',  // 必填，格式：acs:ram::ACCOUNT_ID:role/ROLE_NAME
  roleSessionName: 'session-name'  // 可选，不填会自动生成
};
```

#### Q7: 错误信息：`session duration should be in the range of 900s - max session duration`

**问题现象**：
```
Error: session duration should be in the range of 900s - max session duration
```

**根本原因**：
在 RAM 角色扮演或 OIDC 角色扮演中，设置的 `roleSessionExpiration`（或 `durationSeconds`）小于 900 秒（15 分钟）。阿里云 STS 服务要求会话持续时间至少为 900 秒。

**解决方案**：
```typescript
const config: Config = {
  type: 'ram_role_arn',
  // ...其他配置
  roleSessionExpiration: 3600  // 必须 >= 900，建议 3600（1小时）
};
```

#### Q8: 错误信息：`must specify a previous credentials provider to asssume role`

**问题现象**：
```
Error: must specify a previous credentials provider to asssume role
```

**根本原因**：
使用 `RAMRoleARNCredentialsProvider` 时，未提供用于扮演角色的前置凭证提供者。扮演 RAM 角色需要先有一个有效的凭证（如 AccessKey 或 STS Token）。

**解决方案**：
```typescript
import { RAMRoleARNCredentialsProvider, StaticAKCredentialsProvider } from '@alicloud/credentials';

// 先创建前置凭证提供者
const previousProvider = StaticAKCredentialsProvider.builder()
  .withAccessKeyId('your-access-key-id')
  .withAccessKeySecret('your-access-key-secret')
  .build();

// 再创建 RAM 角色提供者
const provider = RAMRoleARNCredentialsProvider.builder()
  .withCredentialsProvider(previousProvider)  // 必须提供
  .withRoleArn('acs:ram::123456789012:role/YourRole')
  .withRoleSessionName('session-name')
  .build();
```

#### Q9: 错误信息：`the RoleArn is empty`

**问题现象**：
```
Error: the RoleArn is empty
```

**根本原因**：
在使用 `RAMRoleARNCredentialsProvider` 时，既未在代码中指定 `roleArn`，也未设置环境变量 `ALIBABA_CLOUD_ROLE_ARN`。

**解决方案**：
方式 1：在代码中指定
```typescript
const provider = RAMRoleARNCredentialsProvider.builder()
  .withCredentialsProvider(previousProvider)
  .withRoleArn('acs:ram::123456789012:role/YourRole')  // 显式指定
  .build();
```

方式 2：使用环境变量
```bash
export ALIBABA_CLOUD_ROLE_ARN="acs:ram::123456789012:role/YourRole"
```

#### Q10: 错误信息：`refresh session token failed: ...` 或 `the access key secret is invalid`

**问题现象**：
```
Error: refresh session token failed: {...}
Error: the access key secret is invalid
```

**根本原因**：
扮演 RAM 角色时失败，可能的原因包括：
- 提供的 AccessKey ID 或 Secret 不正确
- 当前身份无权扮演目标角色（缺少 `sts:AssumeRole` 权限）
- 角色 ARN 格式错误或角色不存在
- 角色的信任策略未授权当前身份

**解决方案**：
1. 验证 AccessKey ID 和 Secret 是否正确
2. 在 RAM 控制台检查角色的信任策略，确保当前身份在信任实体列表中
3. 确认角色 ARN 格式：`acs:ram::ACCOUNT_ID:role/ROLE_NAME`
4. 确保当前身份具有 `sts:AssumeRole` 权限

### 4.4 ECS RAM 角色相关问题

#### Q11: 错误信息：`IMDS credentials is disabled`

**问题现象**：
```
Error: IMDS credentials is disabled
```

**根本原因**：
环境变量 `ALIBABA_CLOUD_ECS_METADATA_DISABLED` 被设置为 `true`，导致 ECS 实例元数据服务（IMDS）凭证提供者被禁用。

**解决方案**：
如果需要在 ECS 上使用 RAM 角色，请移除或修改该环境变量：
```bash
unset ALIBABA_CLOUD_ECS_METADATA_DISABLED
# 或
export ALIBABA_CLOUD_ECS_METADATA_DISABLED="false"
```

#### Q12: 错误信息：`get metadata token failed with 500` 或网络超时

**问题现象**：
```
Error: get metadata token failed with 500
Error: connect ETIMEDOUT 100.100.100.200:80
```

**根本原因**：
- 当前环境不是阿里云 ECS 实例，无法访问实例元数据服务（`100.100.100.200`）
- ECS 实例上未绑定 RAM 角色
- 网络配置问题导致无法访问元数据服务
- 超时时间设置过短（默认为 1000ms）

**解决方案**：
1. 确认当前是在阿里云 ECS 实例上运行
2. 在 ECS 控制台为实例绑定 RAM 角色
3. 检查 ECS 实例的安全组规则，确保未阻止访问元数据服务
4. 增加超时时间：
```typescript
const config: Config = {
  type: 'ecs_ram_role',
  timeout: 5000,           // 读取超时（毫秒）
  connectTimeout: 5000     // 连接超时（毫秒）
};
```

#### Q13: 错误信息：`get role name failed: GET http://100.100.100.200/latest/meta-data/ram/security-credentials/ 404`

**问题现象**：
```
Error: get role name failed: GET http://100.100.100.200/latest/meta-data/ram/security-credentials/ 404
```

**根本原因**：
ECS 实例未绑定任何 RAM 角色，导致元数据服务返回 404 错误。

**解决方案**：
1. 在阿里云 ECS 控制台，为该实例绑定一个 RAM 角色
2. 或在代码中显式指定角色名称：
```typescript
const config: Config = {
  type: 'ecs_ram_role',
  roleName: 'your-role-name'  // 显式指定角色名，避免自动获取
};
```

#### Q14: 错误信息：`get sts token failed, httpStatus: 500, message = ...`

**问题现象**：
```
Error: get sts token failed, httpStatus: 500, message = {"Code":"InvalidAccessKeyId.NotFound","Message":"..."}
```

**根本原因**：
从元数据服务获取 STS Token 时失败，可能的原因：
- RAM 角色的权限策略配置错误
- 角色被删除或禁用
- 元数据服务内部错误

**解决方案**：
1. 在 RAM 控制台检查角色是否存在且状态正常
2. 检查角色的权限策略是否正确配置
3. 稍后重试，可能是临时性服务故障

#### Q15: IMDSv1 与 IMDSv2 相关问题

**问题现象**：
在安全审计中发现使用了不安全的 IMDSv1

**根本原因**：
默认情况下，SDK 会尝试使用 IMDSv2，如果失败则回退到 IMDSv1。IMDSv1 存在 SSRF 安全风险。

**解决方案**：
强制禁用 IMDSv1，仅使用 IMDSv2：
```typescript
const config: Config = {
  type: 'ecs_ram_role',
  disableIMDSv1: true  // 强制使用 IMDSv2
};
```

或通过环境变量：
```bash
export ALIBABA_CLOUD_IMDSV1_DISABLED="true"
```

### 4.5 OIDC 角色相关问题

#### Q16: 错误信息：`roleArn does not exist and env ALIBABA_CLOUD_ROLE_ARN is null.`

**问题现象**：
```
Error: roleArn does not exist and env ALIBABA_CLOUD_ROLE_ARN is null.
```

**根本原因**：
使用 `oidc_role_arn` 类型时，既未在配置中指定 `roleArn`，也未设置环境变量 `ALIBABA_CLOUD_ROLE_ARN`。

**解决方案**：
```typescript
const config: Config = {
  type: 'oidc_role_arn',
  roleArn: 'acs:ram::123456789012:role/YourRole',  // 必填
  oidcProviderArn: 'acs:ram::123456789012:oidc-provider/YourProvider',
  oidcTokenFilePath: '/path/to/token'
};
```

或设置环境变量：
```bash
export ALIBABA_CLOUD_ROLE_ARN="acs:ram::123456789012:role/YourRole"
```

#### Q17: 错误信息：`oidcProviderArn does not exist and env ALIBABA_CLOUD_OIDC_PROVIDER_ARN is null.`

**问题现象**：
```
Error: oidcProviderArn does not exist and env ALIBABA_CLOUD_OIDC_PROVIDER_ARN is null.
```

**根本原因**：
使用 OIDC 认证时，未提供 OIDC 身份提供商 ARN。

**解决方案**：
```typescript
const config: Config = {
  type: 'oidc_role_arn',
  roleArn: 'acs:ram::123456789012:role/YourRole',
  oidcProviderArn: 'acs:ram::123456789012:oidc-provider/YourProvider',  // 必填
  oidcTokenFilePath: '/path/to/token'
};
```

#### Q18: 错误信息：`oidcTokenFilePath is not exists and env ALIBABA_CLOUD_OIDC_TOKEN_FILE is null.`

**问题现象**：
```
Error: oidcTokenFilePath is not exists and env ALIBABA_CLOUD_OIDC_TOKEN_FILE is null.
```

**根本原因**：
使用 OIDC 认证时，未指定 OIDC Token 文件路径。

**解决方案**：
```typescript
const config: Config = {
  type: 'oidc_role_arn',
  roleArn: 'acs:ram::123456789012:role/YourRole',
  oidcProviderArn: 'acs:ram::123456789012:oidc-provider/YourProvider',
  oidcTokenFilePath: '/var/run/secrets/oidc-token'  // 必填
};
```

在 GitHub Actions 等 CI/CD 环境中的示例：
```yaml
- name: Get OIDC Token
  run: |
    echo "${{ steps.get-token.outputs.token }}" > /tmp/oidc_token

- name: Use Credentials
  env:
    ALIBABA_CLOUD_ROLE_ARN: ${{ secrets.ROLE_ARN }}
    ALIBABA_CLOUD_OIDC_PROVIDER_ARN: ${{ secrets.OIDC_PROVIDER_ARN }}
    ALIBABA_CLOUD_OIDC_TOKEN_FILE: /tmp/oidc_token
```

#### Q19: 错误信息：`get sts token failed with OIDC: ...`

**问题现象**：
```
Error: get sts token failed with OIDC: {"Code":"InvalidOIDCToken","Message":"..."}
```

**根本原因**：
OIDC Token 验证失败，可能的原因：
- Token 已过期
- Token 格式不正确
- OIDC 身份提供商配置错误
- 角色信任策略未正确配置

**解决方案**：
1. 检查 Token 文件内容是否有效
2. 在 RAM 控制台检查 OIDC 身份提供商的配置（Issuer URL、受众等）
3. 确认角色的信任策略中包含了正确的 OIDC 条件
4. 确保 Token 未过期（通常有效期较短）

### 4.6 RSA 密钥对相关问题

#### Q20: 错误信息：`Missing required publicKeyId option in config for rsa_key_pair`

**问题现象**：
```
Error: Missing required publicKeyId option in config for rsa_key_pair
```

**根本原因**：
使用 `rsa_key_pair` 类型时，未提供必需的 `publicKeyId` 字段。

**解决方案**：
```typescript
const config: Config = {
  type: 'rsa_key_pair',
  publicKeyId: 'your-public-key-id',      // 必填
  privateKeyFile: '/path/to/private-key'  // 必填
};
```

**注意**：RSA 密钥对认证方式仅日本站支持。

#### Q21: 错误信息：`privateKeyFile /path/to/key cannot be empty`

**问题现象**：
```
Error: privateKeyFile /path/to/private-key cannot be empty
```

**根本原因**：
指定的私钥文件路径不存在。

**解决方案**：
1. 确认私钥文件路径正确
2. 确认文件存在且可读：
```bash
ls -l /path/to/private-key
chmod 600 /path/to/private-key  # 设置正确的文件权限
```

#### Q22: 错误信息：`Has no read permission to credentials file`

**问题现象**：
```
Error: Has no read permission to credentials file
```

**根本原因**：
当前进程对私钥文件或配置文件没有读取权限。

**解决方案**：
```bash
# 为当前用户添加读取权限
chmod 600 /path/to/private-key

# 或修改文件所有者
sudo chown $USER:$USER /path/to/private-key
```

### 4.7 凭证 URI 相关问题

#### Q23: 错误信息：`Missing required credentialsURI option in config or environment variable for credentials_uri`

**问题现象**：
```
Error: Missing required credentialsURI option in config or environment variable for credentials_uri
```

**根本原因**：
使用 `credentials_uri` 类型时，未提供凭证服务的 URI 地址。

**解决方案**：
```typescript
const config: Config = {
  type: 'credentials_uri',
  credentialsURI: 'http://your-credential-server/credentials'  // 必填
};
```

或使用环境变量：
```bash
export ALIBABA_CLOUD_CREDENTIALS_URI="http://your-credential-server/credentials"
```

#### Q24: 错误信息：`get sts token failed, httpStatus: 404, message = ...`

**问题现象**：
```
Error: get sts token failed, httpStatus: 404, message = Not Found
```

**根本原因**：
指定的 credentials URI 不存在或返回非 200 状态码。

**解决方案**：
1. 确认 URI 地址正确，可以通过 curl 测试：
```bash
curl -v http://your-credential-server/credentials
```
2. 确保凭证服务正常运行
3. 检查网络连通性和防火墙规则

#### Q25: 错误信息：`error retrieving credentials from credentialsURI result: {...}`

**问题现象**：
```
Error: error retrieving credentials from credentialsURI result: {"Code":"Success"}
```

**根本原因**：
凭证 URI 返回的 JSON 响应缺少必需的字段（`AccessKeyId`、`AccessKeySecret` 或 `SecurityToken`）。

**解决方案**：
确保凭证服务返回以下格式的 JSON：
```json
{
  "Code": "Success",
  "AccessKeyId": "STS.***",
  "AccessKeySecret": "***",
  "SecurityToken": "***",
  "Expiration": "2024-12-31T23:59:59Z"
}
```

#### Q26: 错误信息：`get sts token failed, json parse failed: ...`

**问题现象**：
```
Error: get sts token failed, json parse failed: Unexpected token < in JSON at position 0
```

**根本原因**：
凭证 URI 返回的内容不是有效的 JSON 格式（可能是 HTML 错误页面或其他格式）。

**解决方案**：
1. 检查凭证服务是否正确返回 JSON 格式
2. 确认 Content-Type 为 `application/json`
3. 使用 curl 查看实际返回内容：
```bash
curl -H "Accept: application/json" http://your-credential-server/credentials
```

### 4.8 环境变量凭证相关问题

#### Q27: 错误信息：`unable to get credentials from enviroment variables, Access key ID must be specified via environment variable (ALIBABA_CLOUD_ACCESS_KEY_ID)`

**问题现象**：
```
Error: unable to get credentials from enviroment variables, Access key ID must be specified via environment variable (ALIBABA_CLOUD_ACCESS_KEY_ID)
```

**根本原因**：
使用默认凭证提供链时，环境变量凭证提供者检测到 `ALIBABA_CLOUD_ACCESS_KEY_ID` 未设置或为空。

**解决方案**：
设置必需的环境变量：
```bash
export ALIBABA_CLOUD_ACCESS_KEY_ID="your-access-key-id"
export ALIBABA_CLOUD_ACCESS_KEY_SECRET="your-access-key-secret"
```

如果不想使用环境变量，可以通过配置文件或显式创建凭证对象。

#### Q28: 错误信息：`unable to get credentials from enviroment variables, Access key secret must be specified via environment variable (ALIBABA_CLOUD_ACCESS_KEY_SECRET)`

**问题现象**：
```
Error: unable to get credentials from enviroment variables, Access key secret must be specified via environment variable (ALIBABA_CLOUD_ACCESS_KEY_SECRET)
```

**根本原因**：
`ALIBABA_CLOUD_ACCESS_KEY_ID` 已设置，但 `ALIBABA_CLOUD_ACCESS_KEY_SECRET` 未设置或为空。

**解决方案**：
确保两个环境变量都已正确设置：
```bash
export ALIBABA_CLOUD_ACCESS_KEY_ID="LTAI***"
export ALIBABA_CLOUD_ACCESS_KEY_SECRET="your-secret"
```

### 4.9 配置文件相关问题

#### Q29: 错误信息：`cannot found home dir`

**问题现象**：
```
Error: cannot found home dir
```

**根本原因**：
SDK 无法获取用户主目录（通过 `os.homedir()`），这在某些特殊环境（如容器、CI/CD）中可能发生。

**解决方案**：
显式指定配置文件路径：
```bash
export ALIBABA_CLOUD_CREDENTIALS_FILE="/etc/alibabacloud/credentials"
```

或在代码中使用其他凭证类型（如环境变量、URI）。

#### Q30: 错误信息：`reading aliyun cli config from '...' failed.`

**问题现象**：
```
Error: reading aliyun cli config from '/root/.aliyun/config.json' failed.
```

**根本原因**：
阿里云 CLI 配置文件不存在或无法读取。

**解决方案**：
1. 确认配置文件路径正确
2. 创建配置文件（如果使用 CLI Profile Provider）：
```bash
mkdir -p ~/.aliyun
cat > ~/.aliyun/config.json << EOF
{
  "current": "default",
  "profiles": [
    {
      "name": "default",
      "mode": "AK",
      "access_key_id": "your-access-key-id",
      "access_key_secret": "your-access-key-secret"
    }
  ]
}
EOF
```
3. 或禁用 CLI Profile Provider：
```bash
export ALIBABA_CLOUD_CLI_PROFILE_DISABLED="true"
```

#### Q31: 错误信息：`parse aliyun cli config from '...' failed: ...`

**问题现象**：
```
Error: parse aliyun cli config from '/root/.aliyun/config.json' failed: {invalid json}
```

**根本原因**：
配置文件的 JSON 格式错误。

**解决方案**：
1. 使用 JSON 验证工具检查文件格式：
```bash
cat ~/.aliyun/config.json | python -m json.tool
```
2. 修复 JSON 语法错误（如缺少逗号、引号等）

#### Q32: 错误信息：`no any configured profiles in '...'`

**问题现象**：
```
Error: no any configured profiles in '/root/.aliyun/config.json'
```

**根本原因**：
CLI 配置文件中缺少 `profiles` 数组或该数组为空。

**解决方案**：
确保配置文件包含至少一个 profile：
```json
{
  "current": "default",
  "profiles": [
    {
      "name": "default",
      "mode": "AK",
      "access_key_id": "***",
      "access_key_secret": "***"
    }
  ]
}
```

#### Q33: 错误信息：`unable to get profile with 'xxx'`

**问题现象**：
```
Error: unable to get profile with 'production'
```

**根本原因**：
在配置文件中找不到指定名称的 profile。

**解决方案**：
1. 检查配置文件中是否存在该 profile：
```bash
cat ~/.aliyun/config.json | grep -A 5 '"name": "production"'
```
2. 添加缺失的 profile 或使用现有的 profile 名称

#### Q34: 错误信息：`Can not find credential type for "xxx"`

**问题现象**：
```
Error: Can not find credential type for "default"
```

**根本原因**：
在 `~/.alibabacloud/credentials` 配置文件中，指定的 profile 缺少 `type` 字段。

**解决方案**：
确保每个 profile 都有 `type` 字段：
```ini
[default]
type = access_key           # 必填
access_key_id = ***
access_key_secret = ***

[production]
type = ram_role_arn         # 必填
access_key_id = ***
access_key_secret = ***
role_arn = acs:ram::***:role/***
```

#### Q35: 错误信息：`unsupported profile mode 'xxx'`

**问题现象**：
```
Error: unsupported profile mode 'AccessKey'
```

**根本原因**：
CLI 配置文件中的 `mode` 值不在支持的模式列表中。

**解决方案**：
使用以下任一有效的 mode 值：
- `AK` - AccessKey 认证
- `StsToken` - STS Token 认证
- `RamRoleArn` - RAM 角色扮演
- `EcsRamRole` - ECS RAM 角色
- `OIDC` - OIDC 认证
- `ChainableRamRoleArn` - 链式角色扮演

### 4.10 默认凭证提供链相关问题

#### Q36: 错误信息：`unable to get credentials from any of the providers in the chain: ...`

**问题现象**：
```
Error: unable to get credentials from any of the providers in the chain: Error 1, Error 2, Error 3...
```

**根本原因**：
使用默认凭证提供链时，所有的凭证提供者都失败了。凭证提供链按以下顺序尝试：
1. 环境变量
2. OIDC
3. CLI Profile
4. Profile 配置文件
5. ECS 实例元数据服务
6. 凭证 URI

**解决方案**：
根据错误消息中的具体错误信息，逐一排查：
1. 检查环境变量是否设置正确
2. 检查配置文件是否存在且格式正确
3. 如果在 ECS 上，确认已绑定 RAM 角色
4. 确保至少有一种凭证来源可用

示例调试方法：
```typescript
import { DefaultCredentialsProvider } from '@alicloud/credentials';

const provider = DefaultCredentialsProvider.builder().build();
try {
  const cred = await provider.getCredentials();
  console.log('Success:', cred);
} catch (error) {
  console.error('All providers failed:', error.message);
  // 根据错误消息分析具体是哪个环节出错
}
```

### 4.11 Bearer Token 相关问题

#### Q37: 错误信息：`Missing required bearerToken option in config for bearer`

**问题现象**：
```
Error: Missing required bearerToken option in config for bearer
```

**根本原因**：
使用 `bearer` 类型时，未提供必需的 `bearerToken` 字段。

**解决方案**：
```typescript
const config: Config = {
  type: 'bearer',
  bearerToken: 'your-bearer-token'  // 必填
};
```

### 4.12 网络和超时相关问题

#### Q38: 网络请求超时

**问题现象**：
```
Error: connect ETIMEDOUT
Error: socket hang up
```

**根本原因**：
网络请求超时，可能的原因：
- 网络连接不稳定
- STS 服务响应慢
- 默认超时时间过短（ECS RAM Role 默认 1000ms，其他默认 10000ms）
- 防火墙或代理阻止了请求

**解决方案**：
1. 增加超时时间：
```typescript
const config: Config = {
  type: 'ram_role_arn',
  // ...其他配置
  timeout: 30000,        // 读取超时：30 秒
  connectTimeout: 10000  // 连接超时：10 秒
};
```

2. 检查网络连通性：
```bash
# 测试 STS 服务连通性
curl -v https://sts.aliyuncs.com

# 测试 ECS 元数据服务（仅在 ECS 上）
curl -v http://100.100.100.200/latest/meta-data/
```

3. 配置 HTTP 代理（如果需要）：
```bash
export HTTP_PROXY=http://proxy-server:port
export HTTPS_PROXY=http://proxy-server:port
```

#### Q39: STS 区域端点选择问题

**问题现象**：
访问 STS 服务速度慢或失败

**根本原因**：
默认使用全球 STS 端点 (`sts.aliyuncs.com`)，可能不是最优选择。

**解决方案**：
使用区域化的 STS 端点：
```typescript
const config: Config = {
  type: 'ram_role_arn',
  // ...其他配置
  stsRegionId: 'cn-hangzhou',  // 指定区域
  enableVpc: false             // 是否使用 VPC 端点
};
```

或通过环境变量：
```bash
export ALIBABA_CLOUD_STS_REGION="cn-hangzhou"
```

常用区域 ID：
- `cn-hangzhou` - 华东1（杭州）
- `cn-shanghai` - 华东2（上海）
- `cn-beijing` - 华北2（北京）
- `cn-shenzhen` - 华南1（深圳）
- `ap-southeast-1` - 新加坡

VPC 端点格式：`sts-vpc.{region}.aliyuncs.com`

### 4.13 安全最佳实践

#### Q40: 如何避免在代码中硬编码敏感信息？

**问题描述**：
将 AccessKey 直接写在代码中存在安全风险，可能导致泄露。

**最佳实践**：

1. **使用环境变量**（推荐）：
```typescript
// ✅ 推荐：不在代码中硬编码
const cred = new Credential();  // 自动从环境变量获取

// 在启动前设置环境变量
// export ALIBABA_CLOUD_ACCESS_KEY_ID="***"
// export ALIBABA_CLOUD_ACCESS_KEY_SECRET="***"
```

2. **使用配置文件**：
```bash
# ~/.alibabacloud/credentials
[default]
type = access_key
access_key_id = ***
access_key_secret = ***
```

3. **在 ECS 上使用 RAM 角色**（最安全）：
```typescript
const config: Config = {
  type: 'ecs_ram_role',
  roleName: 'your-role-name'  // 可选
};
```

4. **使用密钥管理服务**：
将凭证存储在专门的密钥管理服务（如阿里云 KMS），通过 API 动态获取。

#### Q41: 如何定期轮换凭证？

**最佳实践**：
1. 使用 RAM 角色 + STS 临时凭证，自动轮换
2. 定期更换 AccessKey（建议每 90 天）
3. 使用 RAM 子账号而非主账号 AccessKey
4. 为不同的应用使用不同的 RAM 子账号，便于权限隔离

#### Q42: 如何限制凭证的权限范围？

**最佳实践**：
1. 遵循最小权限原则，只授予必需的权限
2. 在 RAM 角色扮演时使用 `policy` 参数进一步限制权限：
```typescript
const config: Config = {
  type: 'ram_role_arn',
  // ...
  policy: JSON.stringify({
    Version: '1',
    Statement: [
      {
        Effect: 'Allow',
        Action: ['oss:GetObject', 'oss:PutObject'],
        Resource: ['acs:oss:*:*:my-bucket/*']
      }
    ]
  })
};
```

### 4.14 TypeScript 和类型相关问题

#### Q43: 类型定义缺失或不正确

**问题现象**：
```
Property 'xxx' does not exist on type 'Config'
```

**解决方案**：
确保导入了正确的类型：
```typescript
import Credential, { Config, CredentialModel } from '@alicloud/credentials';

const config: Config = {
  type: 'access_key',
  accessKeyId: 'xxx',
  accessKeySecret: 'xxx'
};

const cred = new Credential(config);
const credModel: CredentialModel = await cred.getCredential();
```

### 4.15 Node.js 版本兼容性问题

#### Q44: 错误信息：`Unexpected token` 或语法错误

**问题现象**：
```
SyntaxError: Unexpected token '??'
SyntaxError: Cannot use import statement outside a module
```

**根本原因**：
Node.js 版本过低，不支持 SDK 使用的语法特性。

**解决方案**：
1. 升级 Node.js 至 12.0 或更高版本：
```bash
node -v  # 检查当前版本
nvm install 18  # 使用 nvm 安装新版本
nvm use 18
```

2. 如果无法升级，使用 Babel 转译代码

### 4.16 异步操作相关问题

#### Q45: 凭证更新不及时

**问题现象**：
在 ECS 上运行长时间后，凭证过期导致请求失败。

**根本原因**：
默认情况下，凭证不会自动在后台更新。

**解决方案**：
启用异步凭证更新（仅 ECS RAM Role 支持）：
```typescript
const config: Config = {
  type: 'ecs_ram_role',
  asyncCredentialUpdateEnabled: true  // 启用后台自动更新
};
```

启用后，SDK 会每分钟检查凭证是否需要刷新，并在后台自动更新。

#### Q46: 正确处理异步错误

**最佳实践**：
```typescript
import Credential from '@alicloud/credentials';

async function getCredentials() {
  try {
    const cred = new Credential();
    const credModel = await cred.getCredential();
    return credModel;
  } catch (error) {
    console.error('Failed to get credentials:', error.message);
    // 根据错误类型进行相应处理
    throw error;
  }
}

// 使用时添加错误处理
getCredentials()
  .then(cred => {
    console.log('Got credentials:', cred.accessKeyId);
  })
  .catch(error => {
    console.error('Error:', error);
    process.exit(1);
  });
```

### 4.17 调试和故障排查

#### Q47: 如何启用调试日志？

**解决方案**：
SDK 使用 `debug` 库进行日志输出，可以通过环境变量启用：
```bash
# 启用所有 SDK 调试日志
export DEBUG=sign

# 运行应用
node your-app.js
```

这将输出签名计算、请求详情等调试信息，有助于排查问题。

#### Q48: 如何确认当前使用的凭证类型和来源？

**解决方案**：
检查凭证模型的 `type` 和 `providerName` 字段：
```typescript
const cred = new Credential();
const credModel = await cred.getCredential();

console.log('Credential Type:', credModel.type);
console.log('Provider Name:', credModel.providerName);

// 输出示例：
// Credential Type: access_key
// Provider Name: default/env
```

`providerName` 格式为 `primary/secondary`，表示凭证提供链的路径。

### 4.18 生产环境部署建议

#### Q49: 生产环境最佳实践

**建议**：

1. **使用 RAM 角色而非 AccessKey**：
   - 在 ECS 上部署时，优先使用 ECS RAM 角色
   - 在容器环境中，使用 OIDC 或凭证 URI

2. **配置合理的超时时间**：
```typescript
const config: Config = {
  type: 'ram_role_arn',
  timeout: 10000,       // 根据网络情况调整
  connectTimeout: 5000
};
```

3. **启用 IMDSv2**（ECS 场景）：
```typescript
const config: Config = {
  type: 'ecs_ram_role',
  disableIMDSv1: true  // 提高安全性
};
```

4. **监控凭证获取失败**：
```typescript
try {
  const cred = await provider.getCredentials();
} catch (error) {
  // 发送告警到监控系统
  logger.error('Credential fetch failed', { error: error.message });
  // 可以实现重试逻辑
}
```

5. **使用区域化 STS 端点**：
```typescript
const config: Config = {
  type: 'ram_role_arn',
  stsRegionId: 'cn-hangzhou',  // 使用就近区域
  enableVpc: true              // 在 VPC 内使用 VPC 端点
};
```

6. **环境隔离**：
   - 开发、测试、生产环境使用不同的 RAM 角色或 AccessKey
   - 通过环境变量或配置文件区分不同环境

#### Q50: 容器化部署注意事项

**建议**：

1. **使用环境变量传递凭证**：
```dockerfile
# Dockerfile
ENV ALIBABA_CLOUD_ACCESS_KEY_ID=""
ENV ALIBABA_CLOUD_ACCESS_KEY_SECRET=""
```

```yaml
# docker-compose.yml
services:
  app:
    environment:
      - ALIBABA_CLOUD_ACCESS_KEY_ID=${ACCESS_KEY_ID}
      - ALIBABA_CLOUD_ACCESS_KEY_SECRET=${ACCESS_KEY_SECRET}
```

2. **在 Kubernetes 中使用 Secret**：
```yaml
apiVersion: v1
kind: Secret
metadata:
  name: alicloud-credentials
type: Opaque
stringData:
  access-key-id: your-access-key-id
  access-key-secret: your-access-key-secret
---
apiVersion: v1
kind: Pod
spec:
  containers:
  - name: app
    env:
    - name: ALIBABA_CLOUD_ACCESS_KEY_ID
      valueFrom:
        secretKeyRef:
          name: alicloud-credentials
          key: access-key-id
    - name: ALIBABA_CLOUD_ACCESS_KEY_SECRET
      valueFrom:
        secretKeyRef:
          name: alicloud-credentials
          key: access-key-secret
```

3. **使用 OIDC（推荐）**：
在支持 OIDC 的环境（如 GitHub Actions、ACK）中，使用 OIDC 进行无密钥认证。

---

## 附录：环境变量完整列表

| 环境变量名称 | 说明 | 适用场景 |
|------------|------|---------|
| `ALIBABA_CLOUD_ACCESS_KEY_ID` | AccessKey ID | 所有需要 AK 的场景 |
| `ALIBABA_CLOUD_ACCESS_KEY_SECRET` | AccessKey Secret | 所有需要 AK 的场景 |
| `ALIBABA_CLOUD_SECURITY_TOKEN` | STS Token | STS 临时凭证 |
| `ALIBABA_CLOUD_ROLE_ARN` | RAM 角色 ARN | RAM 角色扮演、OIDC |
| `ALIBABA_CLOUD_ROLE_SESSION_NAME` | 角色会话名称 | RAM 角色扮演、OIDC |
| `ALIBABA_CLOUD_OIDC_PROVIDER_ARN` | OIDC 身份提供商 ARN | OIDC 认证 |
| `ALIBABA_CLOUD_OIDC_TOKEN_FILE` | OIDC Token 文件路径 | OIDC 认证 |
| `ALIBABA_CLOUD_ECS_METADATA` | ECS RAM 角色名称 | ECS RAM 角色 |
| `ALIBABA_CLOUD_ECS_METADATA_DISABLED` | 禁用 ECS 元数据服务 | ECS RAM 角色 |
| `ALIBABA_CLOUD_IMDSV1_DISABLED` | 禁用 IMDSv1 | ECS RAM 角色 |
| `ALIBABA_CLOUD_CREDENTIALS_URI` | 凭证服务 URI | Credentials URI |
| `ALIBABA_CLOUD_CREDENTIALS_FILE` | 配置文件路径 | Profile Provider |
| `ALIBABA_CLOUD_PROFILE` | Profile 名称 | Profile Provider |
| `ALIBABA_CLOUD_CLI_PROFILE_DISABLED` | 禁用 CLI Profile | CLI Profile Provider |
| `ALIBABA_CLOUD_STS_REGION` | STS 区域 ID | RAM 角色扮演、OIDC |
| `ALIBABA_CLOUD_VPC_ENDPOINT_ENABLED` | 启用 VPC 端点 | RAM 角色扮演、OIDC |

---

## 联系与支持

- **GitHub Issues**：[https://github.com/aliyun/credentials-nodejs/issues](https://github.com/aliyun/credentials-nodejs/issues)
- **阿里云官方文档**：[https://help.aliyun.com/](https://help.aliyun.com/)
- **SDK 源码**：[https://github.com/aliyun/credentials-nodejs](https://github.com/aliyun/credentials-nodejs)

如遇到本文档未涵盖的问题，请在 GitHub Issues 中提问，或参考阿里云官方文档。
