import { ALLOWED_CONTENT_TYPES } from '@/common/constants/upload';

export interface IRepositoryRole {
  id: string;
  name: string;
}

export type IRole = IRepositoryRole;

export type IAllowedContentTypes = (typeof ALLOWED_CONTENT_TYPES)[number];
