import { SetMetadata } from '@nestjs/common';
import { IPermission } from '@/modules/auth/types/auth';

export const PERMISSIONS_METADATA_KEY = 'permission';
export const Permissions = (permissions: IPermission[]) =>
  SetMetadata(PERMISSIONS_METADATA_KEY, permissions);
