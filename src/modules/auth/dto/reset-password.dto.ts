import { IsEmail, IsNotEmpty, IsString, MinLength } from 'class-validator';

export default class ResetPasswordDto {
  @IsNotEmpty()
  @IsEmail()
  email!: string;

  @IsNotEmpty()
  @IsString()
  @MinLength(8)
  newPassword!: string;

  @IsNotEmpty()
  @IsString()
  @MinLength(32)
  resetToken!: string;
}
