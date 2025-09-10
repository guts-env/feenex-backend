import {
  IsEmail,
  IsIn,
  IsOptional,
  IsString,
  MinLength,
  ValidateIf,
} from 'class-validator';
import { type OrganizationType } from '@/database/types/db';

export default class UserRegisterDto {
  @IsString()
  @MinLength(1)
  firstName!: string;

  @IsOptional()
  @IsString()
  middleName?: string;

  @IsString()
  @MinLength(1)
  lastName?: string;

  @IsEmail()
  email!: string;

  @IsString()
  @MinLength(8)
  password!: string;

  @IsIn(['business', 'personal'], {
    message: 'Org type must be either personal or business.',
  })
  orgType!: OrganizationType;

  @ValidateIf((o: UserRegisterDto) => o.orgType === 'business')
  @IsString({
    message: 'Organization name is required.',
  })
  @MinLength(1)
  orgName!: string;
}
