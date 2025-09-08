import { IsEmail, IsNotEmpty, IsString, MinLength } from 'class-validator';

export default class UpdatePasswordDto {
  @IsNotEmpty()
  @IsEmail()
  email!: string;

  @IsNotEmpty()
  @IsString()
  @MinLength(8)
  currentPassword!: string;

  @IsNotEmpty()
  @IsString()
  @MinLength(8)
  newPassword!: string;
}
