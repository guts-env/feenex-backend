import { IsIn, IsNotEmpty, IsUUID } from 'class-validator';
import { type UserRole } from '@/database/types/db';

export default class UpdateMemberRoleDto {
  @IsUUID('4')
  @IsNotEmpty()
  userId!: string;

  @IsIn(['personal_admin', 'business_admin', 'member'])
  @IsNotEmpty()
  role!: UserRole;
}
