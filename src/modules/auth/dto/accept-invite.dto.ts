import { IsNotEmpty, IsOptional, IsString, MinLength } from 'class-validator';

export default class AcceptInviteDto {
  @IsNotEmpty()
  @IsString()
  @MinLength(1)
  firstName!: string;

  @IsOptional()
  @IsString()
  middleName?: string;

  @IsOptional()
  @IsString()
  lastName?: string;

  @IsNotEmpty()
  @IsString()
  @MinLength(8)
  password!: string;

  @IsNotEmpty({ message: 'Invalid invite.' })
  @IsString({ message: 'Invalid invite.' })
  @MinLength(32, { message: 'Invalid invite.' })
  inviteToken!: string;
}
