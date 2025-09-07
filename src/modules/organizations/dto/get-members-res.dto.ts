import { Expose, Type } from 'class-transformer';
import RoleResDto from '@/modules/roles/dto/base-role-res.dto';
import UserResDto from '@/modules/users/dto/base-user-res.dto';

export class MemberResDto extends UserResDto {
  @Expose()
  @Type(() => RoleResDto)
  role!: RoleResDto;
}

export default class GetMembersResDto {
  @Expose()
  count!: number;

  @Expose()
  @Type(() => MemberResDto)
  data!: MemberResDto[];
}
