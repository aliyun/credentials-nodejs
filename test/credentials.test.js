'use strict';

const expect = require('expect.js');
const Credentials = require('../lib/credentials');
const mm = require('mm');


describe('Credentials with no config', function () {
  before(function () {
  });
  after(function () {
    mm.restore();
  });
  it('should success', async function () {
    await new Credentials();
  });
});
describe('Credentials should filed with invalid config ', function () {
  it('should faild when config has no type', async function () {
    let error = '';
    try {
      await new Credentials({});
    } catch (e) {
      error = e.message;
    }
    expect(error).to.be('Missing required type option');
  });
  it('should faild when config has invalid type', async function () {
    let error = '';
    try {
      await new Credentials({
        type: 'invalid_type'
      });
    } catch (e) {
      error = e.message;
    }
    expect(error).to.be('Invalid type option, support: access_key, sts, ecs_ram_role, ram_role_arn, rsa_key_pair');
  });
});


