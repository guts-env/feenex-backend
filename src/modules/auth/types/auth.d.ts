import {
  AccountTypeEnum,
  PermissionActionEnum,
  PermissionResourceEnum,
} from '@/common/constants/enums';
import { type Request } from 'express';
import { type IBaseInterface } from '@/common/modules/base/types/base';
import { type IRole } from '@/common/types/common';
import { type IOrganization } from '@/modules/organizations/types/organizations';

export interface IRegisterUserInput {
  email: string;
  hashedPassword: string;
  organizationName: string;
  accountType: AccountTypeEnum;
}

export interface IRegisterInvitedUserInput {
  email: string;
  hashedPassword: string;
  orgId: string;
  accountType: AccountTypeEnum;
}

export interface IValidateUserInput {
  email: string;
  password: string;
}

export interface IAuthUser extends IBaseInterface {
  id: string;
  user_id: string;
  password: string;
}

export type IUserPassportOrg = Pick<IOrganization, 'id' | 'name' | 'type'>;

export interface IUserPassport {
  email: string;
  sub: string;
  organization: IUserPassportOrg;
  role: IRole;
}

export type IAuthResponse = {
  accessToken: string;
  user: IUserPassport;
};

export type IHeadersWithOrg = Headers & { 'x-organization-header': string };
export type IRequestWithOrgHeader = Request & IHeadersWithOrg;
export interface IAuthenticatedRequest extends IRequestWithOrgHeader {
  user: IUserPassport;
}

export type IExtractedOrgHeader =
  | { jwtOrg?: string; headerOrg?: string }
  | undefined;

export type IPermission = {
  resource: PermissionResourceEnum;
  action: PermissionActionEnum;
};
