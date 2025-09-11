import { Expose, Type } from 'class-transformer';
import RoleResDto from '@/modules/roles/dto/base-role-res.dto';
import UserOrganizationResDto from '@/common/modules/user-organization/dto/base-user-org-res.dto';

class UserLoginDto {
  @Expose()
  id!: string;

  @Expose()
  email!: string;

  @Expose()
  firstName!: string;

  @Expose()
  middleName?: string;

  @Expose()
  lastName?: string;

  @Expose()
  profilePhoto?: string;

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
  refreshToken!: string;

  @Expose()
  @Type(() => UserLoginDto)
  user!: UserLoginDto;
}
