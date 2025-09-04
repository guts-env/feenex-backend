import { IsArray, IsNumber } from 'class-validator';
import GetUserDto from '@/modules/users/dto/get-user.dto';

export default class GetMembersResDto {
  @IsNumber()
  count: number;

  @IsArray()
  data: GetUserDto[];
}
