import { IBaseRepositoryInterface } from '@/common/modules/base/types/base';

export interface IRepositoryInvite extends IBaseRepositoryInterface {
  email: string;
  organization_id: string;
  token: string;
  expires_at: Date;
  used_at: Date;
  used: boolean;
}

export type IInvite = IRepositoryInvite;
