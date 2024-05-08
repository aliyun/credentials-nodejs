

import ICredential from '../icredential';

import EcsRamRoleCredential from '../ecs_ram_role_credential';

export default {
  getCredential(): ICredential {
    const roleName = process.env.ALIBABA_CLOUD_ECS_METADATA;
    const enableIMDSv2 = process.env.ALIBABA_CLOUD_ECS_IMDSV2_ENABLE;
    if (roleName && roleName.length) {
      return new EcsRamRoleCredential(roleName, {}, enableIMDSv2 && enableIMDSv2.toLowerCase() === 'true');
    }

    return null;
  }
}
