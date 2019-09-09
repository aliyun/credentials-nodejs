'use strict';
const EcsRamRoleCredential = require('../ecs_ram_role_credential');

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