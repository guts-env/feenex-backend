import { Expose, Transform, Type } from 'class-transformer';
import RoleResDto from '@/modules/roles/dto/base-role-res.dto';
import UserResDto from '@/modules/users/dto/base-user-res.dto';
import { type UserOrganizations } from '@/database/types/db';

export class MemberResDto extends UserResDto {
  @Expose()
  @Type(() => RoleResDto)
  role!: RoleResDto;

  @Expose()
  @Transform(({ obj }: { obj: UserOrganizations }) => obj.created_at)
  joinedAt!: Date;
}

export default class GetMembersResDto {
  @Expose()
  count!: number;

  @Expose()
  @Type(() => MemberResDto)
  data!: MemberResDto[];
}
