import { IsEmail, IsNotEmpty, IsString, IsUUID } from 'class-validator';

export default class AcceptInviteDto {
  @IsUUID('4')
  @IsNotEmpty()
  inviteToken: string;

  @IsEmail()
  @IsNotEmpty()
  email: string;

  @IsString()
  @IsNotEmpty()
  password: string;
}
