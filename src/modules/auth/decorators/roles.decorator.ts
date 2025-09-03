import { UserRoleEnum } from '@/common/constants/enums';
import { SetMetadata } from '@nestjs/common';

export const ROLES_METADATA_KEY = 'roles';
const Roles = (...roles: UserRoleEnum[]) =>
  SetMetadata(ROLES_METADATA_KEY, roles);

export const AllRoles = () =>
  Roles(
    UserRoleEnum.PERSONAL_ADMIN,
    UserRoleEnum.BUSINESS_ADMIN,
    UserRoleEnum.MEMBER,
  );

export const AdminsOnly = () =>
  Roles(UserRoleEnum.PERSONAL_ADMIN, UserRoleEnum.BUSINESS_ADMIN);

export const BusinessOnly = () => Roles(UserRoleEnum.BUSINESS_ADMIN);

export const PersonalOnly = () => Roles(UserRoleEnum.PERSONAL_ADMIN);
