

import ICredential from '../icredential';

import EcsRamRoleCredential from '../ecs_ram_role_credential';

export default {
  getCredential(): ICredential {
    const roleName = process.env.ALIBABA_CLOUD_ECS_METADATA;
    if (roleName && roleName.length) {
      return new EcsRamRoleCredential(roleName);
    }

    return null;
  }
}
