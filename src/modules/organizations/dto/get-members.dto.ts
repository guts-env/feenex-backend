import PaginatedDto from '@/common/dto/paginated.dto';
import { IsOptional, IsUUID } from 'class-validator';
import { type Users } from '@/database/types/db';

export default class GetMembersDto extends PaginatedDto<Users> {
  @IsUUID('4')
  @IsOptional()
  roleId?: string;
}

export type GetMembersDtoValue = GetMembersDto[keyof GetMembersDto];
export type GetMembersDtoValues = GetMembersDtoValue[];
