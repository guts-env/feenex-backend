import {
  type IBaseInterface,
  type IBaseRepositoryInterface,
} from '@/common/modules/base/types/base';
import { type IRole } from '@/common/types/common';
import { type IOrganization } from '@/modules/organizations/types/organizations';
import { AccountTypeEnum } from '@/common/constants/enums';

export interface IRepositoryUser extends IBaseRepositoryInterface {
  email: string;
  first_name?: string;
  middle_name?: string;
  last_name?: string;
  org_id: string;
  org_name: string;
  org_type: AccountTypeEnum;
  role_id: string;
  role_name: string;
}

export interface IUser extends IBaseInterface {
  email: string;
  first_name?: string;
  middle_name?: string;
  last_name?: string;
  organization: Partial<IOrganization> & Pick<IOrganization, 'id'>;
  role: IRole;
}
