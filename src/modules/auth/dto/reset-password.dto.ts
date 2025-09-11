import { IsNotEmpty, IsString, MinLength } from 'class-validator';

export default class ResetPasswordDto {
  @IsNotEmpty({ message: 'New password is required.' })
  @IsString({ message: 'New password contains invalid characters.' })
  @MinLength(8)
  newPassword!: string;

  @IsNotEmpty({ message: 'Invalid transaction.' })
  @IsString({ message: 'Invalid transaction.' })
  @MinLength(32)
  resetToken!: string;
}
