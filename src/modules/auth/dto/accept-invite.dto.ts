import { IsNotEmpty, IsOptional, IsString, MinLength } from 'class-validator';
import { Trim } from '@/common/decorators/trim.decorator';

export default class AcceptInviteDto {
  @Trim()
  @IsNotEmpty()
  @IsString()
  @MinLength(1)
  firstName!: string;

  @IsOptional()
  @Trim()
  @IsString()
  middleName?: string;

  @IsOptional()
  @Trim()
  @IsString()
  lastName?: string;

  @Trim()
  @IsNotEmpty()
  @IsString()
  @MinLength(8)
  password!: string;

  @Trim()
  @IsNotEmpty({ message: 'Invalid invite.' })
  @IsString({ message: 'Invalid invite.' })
  @MinLength(32, { message: 'Invalid invite.' })
  inviteToken!: string;
}
