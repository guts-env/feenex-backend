import {
  IsEmail,
  IsIn,
  IsOptional,
  IsString,
  MinLength,
  ValidateIf,
} from 'class-validator';
import { type OrganizationType } from '@/database/types/db';
import { Trim } from '@/common/decorators/trim.decorator';

export default class UserRegisterDto {
  @Trim()
  @IsString()
  @MinLength(1)
  firstName!: string;

  @IsOptional()
  @Trim()
  @IsString()
  middleName?: string;

  @Trim()
  @IsString()
  @MinLength(1)
  lastName?: string;

  @Trim()
  @IsEmail()
  email!: string;

  @Trim()
  @IsString()
  @MinLength(8)
  password!: string;

  @IsIn(['business', 'personal'], {
    message: 'Org type must be either personal or business.',
  })
  orgType!: OrganizationType;

  @ValidateIf((o: UserRegisterDto) => o.orgType === 'business')
  @Trim()
  @IsString({
    message: 'Organization name is required.',
  })
  @MinLength(1)
  orgName!: string;
}
