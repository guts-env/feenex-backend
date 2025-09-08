import { IsEmail, IsNotEmpty } from 'class-validator';

export default class RequestResetPasswordDto {
  @IsNotEmpty()
  @IsEmail()
  email!: string;
}
