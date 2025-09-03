import { IBaseRepositoryInterface } from '@/common/modules/base/types/base';
import { AccountTypeEnum } from '@/common/constants/enums';

export interface IRepositoryOrganization extends IBaseRepositoryInterface {
  name: string;
  type: AccountTypeEnum;
}

export type IOrganization = IRepositoryOrganization;
