import { IsEnum, IsNotEmpty, IsUUID } from 'class-validator';
import { UserRoleEnum } from '@/common/constants/enums';

export default class UpdateMemberRoleDto {
  @IsUUID('4')
  @IsNotEmpty()
  userId!: string;

  @IsEnum(UserRoleEnum)
  @IsNotEmpty()
  role!: UserRoleEnum;
}
