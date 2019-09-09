'use strict';
const EnvironmentVariableCredentialsProvider = require('./environment_variable_credentials_provider');
const ProfileCredentialsProvider = require('./profile_credentials_provider');
const InstanceRamRoleCredentialsProvider = require('./instance_ram_role_credentials_provider');
const defaultProviders = [EnvironmentVariableCredentialsProvider, ProfileCredentialsProvider, InstanceRamRoleCredentialsProvider];

const providerChan = {
  getCredentials(providers) {
    const providerChan = providers || defaultProviders;
    let credentials = null;
    providerChan.forEach(provider => {
      let result = new provider().getCredential();
      if (result) {
        credentials = result;
        return;
      }
    });
    return credentials;
  }
};
module.exports = providerChan;