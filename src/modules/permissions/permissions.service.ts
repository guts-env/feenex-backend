import { Injectable } from '@nestjs/common';
import { PermissionsRepository } from '@/modules/permissions/permissions.repository';
import { type IPermission } from '@/modules/auth/types/auth';
import find from 'lodash/find';

@Injectable()
export class PermissionsService {
  constructor(private readonly permissionsRepository: PermissionsRepository) {}

  async findByUserAndOrgId(
    userId: string,
    orgId: string,
  ): Promise<IPermission[]> {
    const permissions = await this.permissionsRepository.findByUserAndOrgId(
      userId,
      orgId,
    );

    return permissions;
  }

  async hasPermissions(
    userId: string,
    orgId: string,
    requiredPermissions: IPermission[],
  ): Promise<boolean> {
    const permissions = await this.findByUserAndOrgId(userId, orgId);

    for (const requiredPerm of requiredPermissions) {
      const hasPermission = find(permissions, requiredPerm);
      if (!hasPermission) {
        return false;
      }
    }

    return true;
  }
}
