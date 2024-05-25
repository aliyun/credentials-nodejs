

import * as ProviderChain from '../src/provider/provider_chain';
import environmentVariableCredentialsProvider from '../src/provider/environment_variable_credentials_provider';
import oidcRoleArnCredentialsProvider from '../src/provider/oidc_role_arn_credentials_provider';
import profileCredentialsProvider from '../src/provider/profile_credentials_provider';
import instanceRamRoleCredentialsProvider from '../src/provider/instance_ram_role_credentials_provider';
import DefaultCredential from '../src/default_credential';
import mm from 'mm';
import expect from 'expect.js';
import 'mocha';
import ICredential from '../src/icredential';
import Config from '../src/config';
import assert from 'assert'

describe('ProviderChain', function () {
  before(function () {
    mm(environmentVariableCredentialsProvider, 'getCredential', function (): ICredential {
      const conf = new Config({ type: 'environment' });
      return new DefaultCredential(conf);
    });

    mm(oidcRoleArnCredentialsProvider, 'getCredential', function (): ICredential {
      const conf = new Config({ type: 'oidc' });
      return new DefaultCredential(conf);
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

  it('should return EnvironmentVariableCredential first', async function () {
    let cred = ProviderChain.getCredentials();
    let type = cred.getType();
    expect(type).to.be('environment');
  });
});

describe('ProviderChain', function () {
  before(function () {
    mm(environmentVariableCredentialsProvider, 'getCredential', function (): any {
      return null;
    });

    mm(oidcRoleArnCredentialsProvider, 'getCredential', function (): ICredential {
      const conf = new Config({ type: 'oidc' });
      return new DefaultCredential(conf);
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

  it('should return oidcRoleArnCredential second', async function () {
    let cred = ProviderChain.getCredentials();
    let type = cred.getType();
    expect(type).to.be('oidc');
  });
});

describe('ProviderChain', function () {
  before(function () {
    mm(environmentVariableCredentialsProvider, 'getCredential', function (): any {
      return null;
    });

    mm(oidcRoleArnCredentialsProvider, 'getCredential', function (): any {
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

  it('should return profileCredential third', async function () {
    let cred = ProviderChain.getCredentials();
    let type = cred.getType();
    expect(type).to.be('profile');
  });
});

describe('ProviderChain', function () {
  before(function () {
    mm(environmentVariableCredentialsProvider, 'getCredential', function (): any {
      return null;
    });
    mm(oidcRoleArnCredentialsProvider, 'getCredential', function (): any {
      return null;
    });
    mm(profileCredentialsProvider, 'getCredential', function (): any {
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

  it('should return instanceRamRoleCredential fourth', async function () {
    let cred = ProviderChain.getCredentials();
    let type = cred.getType();
    expect(type).to.be('instanceRamRole');
  });
});

describe('ProviderChain', function () {
  it('should return error', async function () {
    expect(function () {
      ProviderChain.getCredentials();
    }).throwException(/Not found credentials/);
  });
});
