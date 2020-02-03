import environmentVariableCredentialsProvider from './environment_variable_credentials_provider';
import profileCredentialsProvider from './profile_credentials_provider';
import instanceRamRoleCredentialsProvider from './instance_ram_role_credentials_provider';

import ICredential from '../icredential';

type IProvider = {
  getCredential: () => ICredential;
}

const defaultProviders: IProvider[]  = [
  environmentVariableCredentialsProvider,
  profileCredentialsProvider,
  instanceRamRoleCredentialsProvider
];

export function getCredentials(providers: IProvider[] = null): ICredential {
  const providerChain = providers || defaultProviders;
  for (const provider of providerChain) {
    const credential = provider.getCredential();
    if (credential) {
      return credential;
    }
  }
  return null;
}
