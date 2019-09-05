'use strict';
const EnvironmentVariableCredentialsProvider = require('./environmentVariableCredentialsProvider');
const ProfileCredentialsProvider = require('./profileCredentialsProvider');
const InstanceRamRoleCredentialsProvider = require('./instanceRamRoleCredentialsProvider');
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