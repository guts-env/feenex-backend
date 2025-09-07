import {
  IsEmail,
  IsIn,
  IsString,
  MinLength,
  ValidateIf,
} from 'class-validator';
import { type OrganizationType } from '@/database/types/db';

export default class UserRegisterDto {
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
  organizationName!: string;
}
