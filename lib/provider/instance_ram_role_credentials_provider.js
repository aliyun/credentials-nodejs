'use strict';
const EcsRamRoleCredential = require('../ecs_ram_role_credential');

function getCredential() {
  const roleName = process.env.ALIBABA_CLOUD_ECS_METADATA;
  if (roleName && roleName.length) {
    return new EcsRamRoleCredential(roleName);
  }
  return null;
}

module.exports = {
  getCredential
};