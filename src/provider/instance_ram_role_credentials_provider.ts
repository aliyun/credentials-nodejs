

import ICredential from '../icredential';

import EcsRamRoleCredential from '../ecs_ram_role_credential';

export default {
  getCredential(): ICredential {
    const roleName = process.env.ALIBABA_CLOUD_ECS_METADATA;
    const disableIMDSv1 = process.env.ALIBABA_CLOUD_IMDSV1_DISABLE;
    if (roleName && roleName.length) {
      return new EcsRamRoleCredential(roleName, {}, disableIMDSv1 && disableIMDSv1.toLowerCase() === 'true');
    }

    return null;
  }
}
