import { ExpenseStatusEnum } from '@/common/constants/enums';
import {
  IsArray,
  IsDateString,
  IsDecimal,
  IsEnum,
  IsOptional,
  IsString,
  IsUUID,
} from 'class-validator';

export default class GetExpenseDto {
  @IsUUID('4')
  id: string;

  @IsUUID('4')
  organizationId: string;

  @IsUUID('4')
  userId: string;

  @IsUUID('4')
  categoryId: string;

  @IsDecimal({ decimal_digits: '2', force_decimal: true })
  amount: number;

  @IsEnum(ExpenseStatusEnum)
  status: ExpenseStatusEnum;

  @IsString()
  merchantName: string;

  @IsDateString()
  date: string;

  @IsString()
  @IsOptional()
  description: string;

  @IsArray()
  @IsOptional()
  photos: string[];

  @IsDateString()
  createdAt: string;

  @IsDateString()
  updatedAt: string;

  @IsUUID('4')
  createdBy: string;

  @IsUUID('4')
  updatedBy: string;
}
