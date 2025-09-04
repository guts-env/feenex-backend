import { IsNotEmpty, IsUUID } from 'class-validator';

export default class RemoveMemberDto {
  @IsUUID('4')
  @IsNotEmpty()
  userId: string;
}
