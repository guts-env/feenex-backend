import PaginatedDto from '@/common/dto/paginated.dto';
import { IsOptional, IsUUID } from 'class-validator';

export default class GetMembersDto extends PaginatedDto {
  @IsUUID('4')
  @IsOptional()
  roleId?: string;
}

export type GetMembersDtoValue = GetMembersDto[keyof GetMembersDto];
export type GetMembersDtoValues = GetMembersDtoValue[];
