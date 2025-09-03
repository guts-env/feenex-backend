import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import {
  type IUserPassportOrg,
  type IAuthenticatedRequest,
} from '@/modules/auth/types/auth';

export const CurrentOrganization = createParamDecorator(
  (
    key: keyof IUserPassportOrg | undefined,
    ctx: ExecutionContext,
  ):
    | IUserPassportOrg
    | IUserPassportOrg[keyof IUserPassportOrg]
    | undefined => {
    const request: IAuthenticatedRequest = ctx.switchToHttp().getRequest();
    const organization = request.user?.organization;
    return key ? organization?.[key] : organization;
  },
);
