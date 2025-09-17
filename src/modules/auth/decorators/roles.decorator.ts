import { SetMetadata } from '@nestjs/common';
import { type UserRole } from '@/database/types/db';

export const ROLES_METADATA_KEY = 'roles';
const Roles = (...roles: UserRole[]) => SetMetadata(ROLES_METADATA_KEY, roles);

export const AllRoles = () =>
  Roles('personal_admin', 'business_admin', 'manager', 'member');
export const AdminsOnly = () => Roles('personal_admin', 'business_admin');
export const BusinessAdminOnly = () => Roles('business_admin');
export const PersonalOnly = () => Roles('personal_admin');
