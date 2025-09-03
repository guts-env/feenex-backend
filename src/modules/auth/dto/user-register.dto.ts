import {
  IsEmail,
  IsEnum,
  IsString,
  MinLength,
  ValidateIf,
} from 'class-validator';
import { AccountTypeEnum } from '@/common/constants/enums';

export default class UserRegisterDto {
  @IsEmail()
  email: string;

  @IsString()
  @MinLength(8)
  password: string;

  @IsEnum(AccountTypeEnum, {
    message: 'Account type must be either personal or business.',
  })
  accountType: AccountTypeEnum;

  @ValidateIf(
    (o: UserRegisterDto) => o.accountType === AccountTypeEnum.BUSINESS,
  )
  @IsString({
    message: 'Organization name is required.',
  })
  @MinLength(1)
  organizationName: string;
}
