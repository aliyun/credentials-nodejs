'use strict';

const fs = require('fs');
const path = require('path');
const expect = require('expect.js');
const mm = require('mm');
const Credentials = require('../lib/credentials');

describe('credentials should not ok with ak config not exists', function () {
  before(function () {
    mm(process.env, 'ALIBABA_CLOUD_CREDENTIALS_FILE', path.join(__dirname, './fixtures/credentials1'));
  });
  after(function () {
    mm.restore();
  });

  it('should failed', async function () {
    let error = '';
    try {
      new Credentials();
    } catch (e) {
      error = e.message;
    }
    expect(error).to.be('Credentials file environment variable "ALIBABA_CLOUD_CREDENTIALS_FILE" cannot be empty');
  });
});

describe('credentials should failed with all credential file not exist', function () {
  before(function () {
    mm(process.env, 'HOME', path.join(__dirname));
  });
  after(function () {
    mm.restore();
  });

  it('should failed', async function () {
    let error = '';
    try {
      new Credentials();
    } catch (e) {
      error = e.message;
    }
    expect(error).to.be('No credentials found');
  });
});

describe('credentials should failed with profile not exists', function () {
  before(function () {
    mm(process.env, 'ALIBABA_CLOUD_CREDENTIALS_FILE', path.join(__dirname, './fixtures/credentials'));
  });
  after(function () {
    mm.restore();
  });

  it('should failed', async function () {
    let error = '';
    try {
      const cred = new Credentials({ profile: 'demo10' });
      await cred.getCredential();
    } catch (e) {
      error = e.message;
    }
    expect(error).to.be('No credentials found: demo10');
  });
});

describe('credentials should failed with profile disable', function () {
  before(function () {
    mm(process.env, 'ALIBABA_CLOUD_CREDENTIALS_FILE', path.join(__dirname, './fixtures/credentials'));
  });
  after(function () {
    mm.restore();
  });

  it('should failed', async function () {
    let error = '';
    try {
      const cred = new Credentials({ profile: 'demo1' });
      await cred.getCredential();
    } catch (e) {
      error = e.message;
    }
    expect(error).to.be('Credentials [demo1] no longer use!');
  });
});

describe('credentials should failed with credentials file has no read permission', function () {
  before(function () {
    mm(process.env, 'ALIBABA_CLOUD_CREDENTIALS_FILE', path.join(__dirname, './fixtures/credentials'));
    mm(fs, 'accessSync', function () {
      throw new Error('No permission');
    });
  });
  after(function () {
    mm.restore();
  });

  it('should failed', async function () {
    let error = '';
    try {
      const cred = new Credentials();
      await cred.getCredential();
    } catch (e) {
      error = e.message;
    }
    expect(error).to.be('Has no read permission to credentials file');
  });
});

describe('credentials should failed with credentials file has no read permission', function () {
  before(function () {
    mm(process.env, 'HOME', path.join(__dirname, './fixtures'));
    mm(fs, 'accessSync', function () {
      throw new Error('No permission');
    });
  });
  after(function () {
    mm.restore();
  });

  it('should failed', async function () {
    let error = '';
    try {
      const cred = new Credentials();
      await cred.getCredential();
    } catch (e) {
      error = e.message;
    }
    expect(error).to.be('No credentials found');
  });
});

describe('credentials should ok with ak env', function () {
  before(function () {
    mm(process.env, 'ALIBABA_CLOUD_ACCESS_KEY_ID', 'access-key-id-01');
    mm(process.env, 'ALIBABA_CLOUD_ACCESS_KEY_SECRET', 'access-key-secret-01');
  });
  after(function () {
    mm.restore();
  });

  it('should success', async function () {
    const cred = new Credentials();
    const data = await cred.getCredential();
    expect(data.accessKeyId).to.be('access-key-id-01');
    expect(data.accessKeySecret).to.be('access-key-secret-01');
    // repeat
    const data2 = await cred.getCredential();
    expect(data2.accessKeyId).to.be('access-key-id-01');
    expect(data2.accessKeySecret).to.be('access-key-secret-01');
  });
});

describe('credentials should ok with ak config exists', function () {
  before(function () {
    mm(process.env, 'ALIBABA_CLOUD_CREDENTIALS_FILE', path.join(__dirname, './fixtures/credentials'));
  });
  after(function () {
    mm.restore();
  });

  it('should success', async function () {
    const cred = new Credentials();
    const data = await cred.getCredential();
    expect(data.accessKeyId).to.be('access-key-id-02');
    expect(data.accessKeySecret).to.be('access-key-secret-02');
    // repeat
    const data2 = await cred.getCredential({ profile: 'demo' });
    expect(data2.accessKeyId).to.be('access-key-id-02');
    expect(data2.accessKeySecret).to.be('access-key-secret-02');
  });
});

describe('credentials should ok with default home config exists', function () {
  before(function () {
    mm(process.env, 'HOME', path.join(__dirname, './fixtures/'));
  });
  after(function () {
    mm.restore();
  });

  it('should success', async function () {
    const cred = new Credentials();
    const data = await cred.getCredential();
    expect(data.accessKeyId).to.be('access-key-id-04');
    expect(data.accessKeySecret).to.be('access-key-secret-04');
    // repeat
    const data2 = await cred.getCredential({ profile: 'demo' });
    expect(data2.accessKeyId).to.be('access-key-id-04');
    expect(data2.accessKeySecret).to.be('access-key-secret-04');
  });
});

describe('credentials should ok with ram role arn', function () {
  before(function () {
    mm(process.env, 'ALIBABA_CLOUD_CREDENTIALS_FILE', path.join(__dirname, './fixtures/credentials'));
    mm(require('@alicloud/sts-sdk').prototype, 'assumeRole', function () {
      return {
        Credentials: {
          AccessKeySecret: 'access-key-secret-06',
          AccessKeyId: 'STS.access-key-id-06',
          Expiration: new Date(Date.now() + 30 * 1000).toISOString(),
          SecurityToken: 'security-token-01'
        }
      };
    });
  });
  after(function () {
    mm.restore();
  });

  it('should success', async function () {
    const cred = new Credentials({ profile: 'demo' });
    const data = await cred.getCredential();
    expect(data.accessKeyId).to.be('STS.access-key-id-06');
    expect(data.accessKeySecret).to.be('access-key-secret-06');
    expect(data.securityToken).to.be('security-token-01');
    expect(Date.now() < new Date(data.expiration)).to.be.ok();
    // repeat
    const data2 = await cred.getCredential();
    expect(data2.accessKeyId).to.be('STS.access-key-id-06');
    expect(data2.accessKeySecret).to.be('access-key-secret-06');
    expect(data2.securityToken).to.be('security-token-01');
    expect(Date.now() < new Date(data2.expiration)).to.be.ok();
  });
});