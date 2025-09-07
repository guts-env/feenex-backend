import { IBaseRepositoryInterface } from '@/common/modules/base/types/base';

export interface IRepositoryInvite extends IBaseRepositoryInterface {
  email: string;
  organization_id: string;
  role_id?: string | null;
  expires_at: Date;
  token: string;
  used: boolean;
  used_at?: Date | null;
}

export type IInvite = IRepositoryInvite;
