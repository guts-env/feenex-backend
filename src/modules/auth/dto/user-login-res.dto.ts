import { Expose, Type } from 'class-transformer';
import RoleResDto from '@/modules/roles/dto/base-role-res.dto';
import UserOrganizationResDto from '@/common/modules/user-organization/dto/base-user-org-res.dto';

class UserLoginDto {
  @Expose()
  sub!: string;

  @Expose()
  email!: string;

  @Expose()
  @Type(() => RoleResDto)
  role!: RoleResDto;

  @Expose()
  @Type(() => UserOrganizationResDto)
  organization!: UserOrganizationResDto;
}

export default class UserLoginResDto {
  @Expose()
  accessToken!: string;

  @Expose()
  @Type(() => UserLoginDto)
  user!: UserLoginDto;
}
