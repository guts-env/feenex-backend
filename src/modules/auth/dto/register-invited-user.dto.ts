import { IsEmail, IsNotEmpty, IsString, IsUUID } from 'class-validator';

export default class RegisterInvitedUserDto {
  @IsUUID('4')
  @IsNotEmpty()
  inviteId: string;

  @IsEmail()
  @IsNotEmpty()
  email: string;

  @IsString()
  @IsNotEmpty()
  password: string;
}
