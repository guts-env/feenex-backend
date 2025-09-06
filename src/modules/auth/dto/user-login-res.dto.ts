import { AccountTypeEnum } from '@/common/constants/enums';
import { Expose, Type } from 'class-transformer';

class UserRoleDto {
  @Expose()
  id: string;

  @Expose()
  name: string;
}

class UserOrganizationDto {
  @Expose()
  id: string;

  @Expose()
  name: string;

  @Expose()
  type: AccountTypeEnum;
}

class UserDto {
  @Expose()
  sub: string;

  @Expose()
  email: string;

  @Expose()
  @Type(() => UserRoleDto)
  role: UserRoleDto;

  @Expose()
  @Type(() => UserOrganizationDto)
  organization: UserOrganizationDto;
}

export class UserLoginResDto {
  @Expose()
  accessToken: string;

  @Expose()
  @Type(() => UserDto)
  user: UserDto;
}
