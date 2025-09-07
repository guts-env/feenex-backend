import { ALLOWED_CONTENT_TYPES } from '@/common/constants/upload';
import { UserRole } from '@/database/types/db';

export interface IRepositoryRole {
  id: string;
  name: UserRole;
}

export type IRole = IRepositoryRole;

export type IAllowedContentTypes = (typeof ALLOWED_CONTENT_TYPES)[number];
