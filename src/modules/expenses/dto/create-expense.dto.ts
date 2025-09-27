import {
  ArrayNotEmpty,
  IsBoolean,
  IsDateString,
  IsIn,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import {
  type ExpenseSource,
  type CurrencyCode,
  type ExpenseStatus,
} from '@/database/types/db';
import { Trim } from '@/common/decorators/trim.decorator';

export class ExpenseItemDto {
  @Trim()
  @IsNotEmpty()
  @IsString()
  name!: string;

  @IsNotEmpty()
  @IsNumber()
  quantity!: number;

  @IsNotEmpty()
  @IsNumber({ maxDecimalPlaces: 2 })
  price!: number;
}

class BaseExpenseDto {
  @IsOptional()
  @Trim()
  @IsString()
  description?: string;

  @IsOptional()
  @IsIn(['draft', 'pending', 'rejected', 'verified'])
  status?: ExpenseStatus;

  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => ExpenseItemDto)
  items?: ExpenseItemDto[];
}

export type IExpenseValue = CreateExpenseDto[keyof CreateExpenseDto];
export type IExpenseValues = IExpenseValue[];

export class CreateExpenseDto extends BaseExpenseDto {
  @IsNotEmpty()
  @IsIn(['api', 'import', 'manual', 'ocr'])
  source!: ExpenseSource;

  @IsNotEmpty()
  @IsUUID('4')
  categoryId!: string;

  @IsOptional()
  @IsUUID('4')
  subscriptionId?: string;

  @IsOptional()
  @IsBoolean()
  isSubscription?: boolean;

  @Trim()
  @IsNotEmpty()
  @IsString()
  merchantName!: string;

  @IsNotEmpty()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Max(999999.99)
  amount!: number;

  @IsNotEmpty()
  @IsDateString()
  invoiceDate!: string;

  @IsOptional()
  @IsDateString()
  paymentDate?: string;

  @IsOptional()
  @IsString({ each: true })
  photos?: string[];

  @IsOptional()
  @IsIn(['PHP', 'USD', 'HKD', 'THB', 'VND'])
  currency?: CurrencyCode;

  @IsOptional()
  @IsUUID('4')
  ocrResultId?: string;

  @IsOptional()
  @IsUUID('4')
  llmResultId?: string;

  @IsOptional()
  @Trim()
  @IsString()
  orNumber?: string;

  @IsOptional()
  @IsBoolean()
  isVat?: boolean;

  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  vat?: number;
}

export class CreateManualExpenseDto extends BaseExpenseDto {
  @IsNotEmpty()
  @IsUUID('4')
  categoryId!: string;

  @Trim()
  @IsNotEmpty()
  @IsString()
  merchantName!: string;

  @IsNotEmpty()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Max(999999.99)
  amount!: number;

  @IsNotEmpty()
  @IsDateString()
  invoiceDate!: string;

  @IsOptional()
  @IsDateString()
  paymentDate?: string;

  @IsOptional()
  @ArrayNotEmpty()
  @IsString({ each: true })
  photos?: string[];

  @IsOptional()
  @IsUUID('4')
  subscriptionId?: string;

  @IsOptional()
  @IsBoolean()
  isSubscription?: boolean;

  @IsOptional()
  @Trim()
  @IsString()
  orNumber?: string;

  @IsOptional()
  @IsBoolean()
  isVat?: boolean;

  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  vat?: number;
}

export class CreateOcrExpenseDto extends BaseExpenseDto {
  @IsNotEmpty()
  @ArrayNotEmpty()
  @IsString({ each: true })
  photos!: string[];
}
