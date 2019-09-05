'use strict';
const EcsRamRoleCredential = require('../ecsRamRoleCredential');

class InstanceRamRoleCredentialsProvider {
  getCredential() {
    const RoleName = process.env.ALIBABA_CLOUD_ECS_METADATA;
    if (RoleName && RoleName.length) {
      return new EcsRamRoleCredential(RoleName);
    }
    return null;
  }
}
module.exports = InstanceRamRoleCredentialsProvider;