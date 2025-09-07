import { type IBaseRepositoryInterface } from '@/common/modules/base/types/base';
import { type IRole } from '@/common/types/common';
import { type IRepositoryOrganization } from '@/modules/organizations/types/organizations';
import { type IUserPassportOrg } from '@/modules/auth/types/auth';
import { OrganizationType, UserRole } from '@/database/types/db';

export interface IBaseRepositoryUser extends IBaseRepositoryInterface {
  email: string;
  first_name?: string | null;
  middle_name?: string | null;
  last_name?: string | null;
}

export interface IRepositoryUserWithRole extends IBaseRepositoryUser {
  role_id: string;
  role_name: UserRole;
}

export interface IUserWithOrgAndRole extends IRepositoryUserWithRole {
  org_id: string;
  org_name: string;
  org_type: OrganizationType;
}

export interface IUser extends IBaseRepositoryInterface {
  email: string;
  first_name?: string | null;
  middle_name?: string | null;
  last_name?: string | null;
  organization: Partial<IRepositoryOrganization> & IUserPassportOrg;
  role: IRole;
}
