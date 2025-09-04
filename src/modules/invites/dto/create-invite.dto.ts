import { IsEmail, IsNotEmpty } from 'class-validator';

export default class CreateInviteDto {
  @IsEmail()
  @IsNotEmpty()
  email: string;
}
