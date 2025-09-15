import { IsIn, IsNotEmpty } from 'class-validator';
import { type UserRole } from '@/database/types/db';

export default class UpdateMemberRoleDto {
  @IsIn(['personal_admin', 'business_admin', 'member'])
  @IsNotEmpty()
  role!: UserRole;
}
