import { IsIn, IsNotEmpty } from 'class-validator';
import { type UserRole } from '@/database/types/db';

export default class UpdateMemberRoleDto {
  @IsIn(['business_admin', 'manager', 'member'])
  @IsNotEmpty()
  role!: UserRole;
}
