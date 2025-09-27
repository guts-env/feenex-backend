import { IsNotEmpty, IsString, MinLength } from 'class-validator';
import { Trim } from '@/common/decorators/trim.decorator';

export default class ResetPasswordDto {
  @Trim()
  @IsNotEmpty({ message: 'New password is required.' })
  @IsString({ message: 'New password contains invalid characters.' })
  @MinLength(8)
  newPassword!: string;

  @Trim()
  @IsNotEmpty({ message: 'Invalid transaction.' })
  @IsString({ message: 'Invalid transaction.' })
  @MinLength(32)
  resetToken!: string;
}
