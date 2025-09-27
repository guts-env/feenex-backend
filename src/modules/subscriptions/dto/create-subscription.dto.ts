import {
  IsBoolean,
  IsDateString,
  IsIn,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
} from 'class-validator';
import { type CurrencyCode } from '@/database/types/db';
import { Trim } from '@/common/decorators/trim.decorator';

export class CreateSubscriptionDto {
  @IsNotEmpty({ message: 'Category ID is required.' })
  @IsUUID('4', { message: 'Category ID must be a valid UUID v4.' })
  categoryId!: string;

  @Trim()
  @IsNotEmpty({ message: 'Merchant name is required.' })
  @IsString({ message: 'Merchant name must be a string.' })
  merchantName!: string;

  @IsNotEmpty({ message: 'Amount is required.' })
  @IsNumber(
    { maxDecimalPlaces: 2 },
    { message: 'Amount must be a number with up to 2 decimal places.' },
  )
  amount!: number;

  @IsOptional()
  @IsIn(['PHP', 'USD', 'HKD', 'THB', 'VND'], {
    message: 'Currency must be one of: PHP, USD, HKD, THB, VND.',
  })
  currency?: CurrencyCode;

  @IsOptional()
  @Trim()
  @IsString({ message: 'Description must be a string.' })
  description?: string;

  @IsNotEmpty({ message: 'Frequency is required.' })
  @IsIn(['daily', 'weekly', 'monthly', 'yearly'], {
    message: 'Frequency must be one of: daily, weekly, monthly, yearly.',
  })
  frequency!: 'daily' | 'weekly' | 'monthly' | 'yearly';

  @IsNotEmpty({ message: 'Start date is required.' })
  @IsDateString(
    {},
    { message: 'Start date must be a valid ISO 8601 date string.' },
  )
  startDate!: string;

  @IsOptional()
  @IsDateString(
    {},
    { message: 'End date must be a valid ISO 8601 date string.' },
  )
  endDate?: string;

  @IsOptional()
  @IsBoolean({ message: 'isVat must be a boolean value.' })
  isVat?: boolean;

  @IsOptional()
  @IsNumber(
    { maxDecimalPlaces: 2 },
    { message: 'VAT must be a number with up to 2 decimal places.' },
  )
  vat?: number;
}
