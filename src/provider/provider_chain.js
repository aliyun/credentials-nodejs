'use strict';
const environmentVariableCredentialsProvider = require('./environment_variable_credentials_provider');
const profileCredentialsProvider = require('./profile_credentials_provider');
const instanceRamRoleCredentialsProvider = require('./instance_ram_role_credentials_provider');
const defaultProviders = [environmentVariableCredentialsProvider, profileCredentialsProvider, instanceRamRoleCredentialsProvider];

const providerChain = {
  getCredentials(providers) {
    const providerChain = providers || defaultProviders;
    let credentials = null;
    for (let provider of providerChain) {
      let cred = provider.getCredential();
      if (cred) {
        credentials = cred;
        break;
      }
    }
    return credentials;
  }
};

module.exports = providerChain;