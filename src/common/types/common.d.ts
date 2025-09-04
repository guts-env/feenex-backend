import { ALLOWED_CONTENT_TYPES } from '@/common/constants/upload';
import { UserRoleEnum } from '@/common/constants/enums';

export interface IRepositoryRole {
  id: string;
  name: UserRoleEnum;
}

export type IRole = IRepositoryRole;

export type IAllowedContentTypes = (typeof ALLOWED_CONTENT_TYPES)[number];
