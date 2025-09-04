import { IsEmail, IsNotEmpty } from 'class-validator';

export default class InviteMemberDto {
  @IsEmail()
  @IsNotEmpty()
  email: string;
}
