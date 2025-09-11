import {
  PermissionActionEnum,
  PermissionResourceEnum,
} from '@/common/constants/enums';
import { type Request } from 'express';
import { type IBaseRepositoryInterface } from '@/common/modules/base/types/base';
import { type IRole } from '@/common/types/common';
import { type IRepositoryOrganization } from '@/modules/organizations/types/organizations';
import { type OrganizationType } from '@/database/types/db';
import { ORGANIZATION_ID_HEADER } from '@/common/constants/header';

export interface IRepositoryAuth extends IBaseRepositoryInterface {
  user_id: string;
  password: string;
}

export interface IRegisterUserInput {
  firstName: string;
  lastName?: string;
  middleName?: string;
  email: string;
  hashedPassword: string;
  orgName: string;
  orgType: OrganizationType;
}

export interface IRegisterInvitedUserInput
  extends Omit<IRegisterUserInput, 'orgName' | 'orgType'> {
  firstName: string;
  lastName?: string;
  middleName?: string;
  email: string;
  hashedPassword: string;
  orgId: string;
}

export interface IValidateUserInput {
  email: string;
  password: string;
}

export interface IAuthUser extends IBaseRepositoryInterface {
  id: string;
  user_id: string;
  password: string;
  reset_password_token?: string | null;
  reset_password_token_expires_at?: Date | null;
}

export type IUserPassportOrg = Pick<
  IRepositoryOrganization,
  'id' | 'name' | 'type'
>;

export interface IUserPassport {
  sub: string;
  email: string;
  organization: IUserPassportOrg;
  role: IRole;
}

export type IAuthResponse = {
  accessToken: string;
  user: IUserPassport;
};

export type IHeadersWithOrg = Headers & { [ORGANIZATION_ID_HEADER]: string };
export type IRequestWithOrgHeader = Request & IHeadersWithOrg;
export interface IAuthenticatedRequest extends IRequestWithOrgHeader {
  user: IUserPassport & {
    first_name: string;
    middle_name?: string | null;
    last_name?: string | null;
    profile_photo?: string | null;
  };
}

export type IExtractedOrgHeader =
  | { jwtOrg?: string; headerOrg?: string }
  | undefined;

export type IPermission = {
  resource: PermissionResourceEnum;
  action: PermissionActionEnum;
};
