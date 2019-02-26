'use strict';

const fs = require('fs');
const path = require('path');
const ini = require('ini');
const StsClient = require('@alicloud/sts-sdk');

class Credentials {
  constructor(option = { profile: 'default' }) {
    this.option = option;
    this.sts = null;
    this.cred = null;
    this.credentials = null;
    this.load();
  }

  load() {
    // set ak env
    if (process.env.ALIBABA_CLOUD_ACCESS_KEY_ID && process.env.ALIBABA_CLOUD_ACCESS_KEY_SECRET) {
      this.credentials = {
        default: {
          enable: true,
          type: 'access_key',
          access_key_id: process.env.ALIBABA_CLOUD_ACCESS_KEY_ID,
          access_key_secret: process.env.ALIBABA_CLOUD_ACCESS_KEY_SECRET
        }
      };
      return;
    }

    // set credentials file env
    if (process.env.ALIBABA_CLOUD_CREDENTIALS_FILE) {
      const file = process.env.ALIBABA_CLOUD_CREDENTIALS_FILE;
      if (!fs.existsSync(file)) {
        throw new Error('Credentials file environment variable "ALIBABA_CLOUD_CREDENTIALS_FILE" cannot be empty');
      }
      this.credentials = this.parse(file);
      return;
    }

    // from home
    const defaultCredentailsFile = path.join(process.env.HOME, '.alibabacloud/credentials');
    if (fs.existsSync(defaultCredentailsFile)) {
      this.credentials = this.parse(defaultCredentailsFile);
      return;
    }

    throw new Error('No credentials found');
  }

  parse(file) {
    const content = ini.parse(fs.readFileSync(file, 'utf-8'));
    return content;
  }

  timeout() {
    // -1: always available
    return this.cred.expiration === -1 || (Date.now() + 3 * 60 * 1000) < new Date(this.cred.expiration);
  }

  async getCredential() {
    // from cache
    if (this.cred && this.timeout()) {
      return this.cred;
    }
    const cred = this.credentials[this.option.profile];
    if (!cred) {
      throw new Error(`No credentials found: ${this.option.profile}`);
    }
    if (!cred.enable) {
      throw new Error(`Credentials [${this.option.profile}] no longer use!`);
    }
    const type = cred.type;
    // ak
    if (type === 'access_key') {
      this.cred = {
        accessKeyId: cred.access_key_id,
        accessKeySecret: cred.access_key_secret,
        expiration: -1
      };
    }
    // ram role arn
    if (type === 'ram_role_arn') {
      if (!this.sts) {
        this.sts = new StsClient({
          accessKeyId: cred.access_key_id,
          accessKeySecret: cred.access_key_secret,
          endpoint: 'sts.aliyuncs.com'
        });
      }
      const role = await this.sts.assumeRole(cred.role_arn, cred.role_session_name);
      const credentials = role.Credentials;
      if (credentials && typeof credentials === 'object') {
        this.cred = {
          accessKeyId: credentials.AccessKeyId,
          accessKeySecret: credentials.AccessKeySecret,
          securityToken: credentials.SecurityToken,
          expiration: credentials.Expiration
        };
      }
    }
    // TODO: bearer token
    // TODO: ecs ram role
    // TODO: rsa key pair
    return this.cred;
  }
}

module.exports = Credentials;