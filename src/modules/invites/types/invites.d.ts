import { IBaseRepositoryInterface } from '@/common/modules/base/types/base';

export interface IRepositoryInvite extends IBaseRepositoryInterface {
  email: string;
  organization_id: string;
  token: string;
}

export type IInvite = IRepositoryInvite;
