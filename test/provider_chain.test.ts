

import * as ProviderChain from '../src/provider/provider_chain';
import environmentVariableCredentialsProvider from '../src/provider/environment_variable_credentials_provider';
import profileCredentialsProvider from '../src/provider/profile_credentials_provider';
import instanceRamRoleCredentialsProvider from '../src/provider/instance_ram_role_credentials_provider';
import DefaultCredential from '../src/default_credential';
import mm from 'mm';
import expect from 'expect.js';
import 'mocha';
import ICredential from '../src/icredential';
import Config from '../src/config';

describe('ProviderChain', function () {
  before(function () {
    mm(environmentVariableCredentialsProvider, 'getCredential', function () {
      const conf = new Config({ type: 'environment' });
      return new DefaultCredential(conf);
    });

    mm(profileCredentialsProvider, 'getCredential', function () {
      const conf = new Config({ type: 'profile' });
      return new DefaultCredential(conf);
    });

    mm(instanceRamRoleCredentialsProvider, 'getCredential', function () {
      const conf = new Config({ type: 'instanceRamRole' });
      return new DefaultCredential(conf);
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
    mm(environmentVariableCredentialsProvider, 'getCredential', function (): ICredential {
      return null;
    });

    mm(profileCredentialsProvider, 'getCredential', function (): ICredential {
      const conf = new Config({ type: 'profile' });
      return new DefaultCredential(conf);
    });

    mm(instanceRamRoleCredentialsProvider, 'getCredential', function (): ICredential {
      const conf = new Config({ type: 'instanceRamRole' });
      return new DefaultCredential(conf);
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
    mm(environmentVariableCredentialsProvider, 'getCredential', function (): ICredential {
      return null;
    });
    mm(profileCredentialsProvider, 'getCredential', function (): ICredential {
      return null;
    });
    mm(instanceRamRoleCredentialsProvider, 'getCredential', function (): ICredential {
      const conf = new Config({ type: 'instanceRamRole' });
      return new DefaultCredential(conf);
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

