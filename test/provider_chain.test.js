'use strict';

const ProviderChain = require('../lib/provider/provider_chain');
const environmentVariableCredentialsProvider = require('../lib/provider/environment_variable_credentials_provider');
const profileCredentialsProvider = require('../lib/provider/profile_credentials_provider');
const instanceRamRoleCredentialsProvider = require('../lib/provider/instance_ram_role_credentials_provider');
const DefaultCredential = require('../lib/default_credential');
const mm = require('mm');
const expect = require('expect.js');


describe('ProviderChain', function () {
  before(function () {
    mm(environmentVariableCredentialsProvider, 'getCredential', function () {
      return new DefaultCredential({ type: 'environment' });
    });
    mm(profileCredentialsProvider, 'getCredential', function () {
      return new DefaultCredential({ type: 'profile' });
    });
    mm(instanceRamRoleCredentialsProvider, 'getCredential', function () {
      return new DefaultCredential({ type: 'instanceRamRole' });
    });
  });
  after(function () {
    mm.restore();
  });
  it('should return EnvironmentVariableCredential first', async function () {
    let cred = ProviderChain.getCredentials();
    let type = cred.getType();
    expect(type).to.be('environment');
  });
});

describe('ProviderChain', function () {
  before(function () {
    mm(environmentVariableCredentialsProvider, 'getCredential', function () {
      return null;
    });
    mm(profileCredentialsProvider, 'getCredential', function () {
      return new DefaultCredential({ type: 'profile' });
    });
    mm(instanceRamRoleCredentialsProvider, 'getCredential', function () {
      return new DefaultCredential({ type: 'instanceRamRole' });
    });
  });
  after(function () {
    mm.restore();
  });
  it('should return profileCredential second', async function () {
    let cred = ProviderChain.getCredentials();
    let type = cred.getType();
    expect(type).to.be('profile');
  });
});
describe('ProviderChain', function () {
  before(function () {
    mm(environmentVariableCredentialsProvider, 'getCredential', function () {
      return null;
    });
    mm(profileCredentialsProvider, 'getCredential', function () {
      return null;
    });
    mm(instanceRamRoleCredentialsProvider, 'getCredential', function () {
      return new DefaultCredential({ type: 'instanceRamRole' });
    });
  });
  after(function () {
    mm.restore();
  });
  it('should return instanceRamRoleCredential third', async function () {
    let cred = ProviderChain.getCredentials();
    let type = cred.getType();
    expect(type).to.be('instanceRamRole');
  });
});

