import { IsEmail, IsNotEmpty } from 'class-validator';
import { Trim } from '@/common/decorators/trim.decorator';

export default class InviteMemberDto {
  @Trim()
  @IsEmail()
  @IsNotEmpty()
  email!: string;
}
