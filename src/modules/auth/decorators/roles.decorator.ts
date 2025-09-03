import { UserRoleEnum } from '@/common/constants/enums';
import { SetMetadata } from '@nestjs/common';

export const ROLES_METADATA_KEY = 'roles';
export const Roles = (...roles: UserRoleEnum[]) =>
  SetMetadata(ROLES_METADATA_KEY, roles);
