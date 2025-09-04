import {
  type IBaseInterface,
  type IBaseRepositoryInterface,
} from '@/common/modules/base/types/base';
import { AccountTypeEnum, UserRoleEnum } from '@/common/constants/enums';
import { type IRole } from '@/common/types/common';
import { type IOrganization } from '@/modules/organizations/types/organizations';
import { type IUserPassportOrg } from '@/modules/auth/types/auth';

export interface IRepositoryUser extends IBaseRepositoryInterface {
  email: string;
  first_name?: string;
  middle_name?: string;
  last_name?: string;
  org_id: string;
  org_name: string;
  org_type: AccountTypeEnum;
  role_id: string;
  role_name: UserRoleEnum;
}

export interface IUser extends IBaseInterface {
  email: string;
  first_name?: string;
  middle_name?: string;
  last_name?: string;
  organization: Partial<IOrganization> & IUserPassportOrg;
  role: IRole;
}
