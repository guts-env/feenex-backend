import { IsEmail, IsNotEmpty, IsString, MinLength } from 'class-validator';

export default class AcceptInviteDto {
  @IsString()
  @MinLength(32)
  inviteToken!: string;

  @IsEmail()
  @IsNotEmpty()
  email!: string;

  @IsString()
  @IsNotEmpty()
  password!: string;
}
