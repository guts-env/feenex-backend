import {
  ArrayNotEmpty,
  IsDateString,
  IsIn,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import {
  type ExpenseSource,
  type CurrencyCode,
  type ExpenseStatus,
} from '@/database/types/db';

export class ExpenseItemDto {
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

export class ExpenseOtherDetailDto {
  @IsNotEmpty()
  @IsString()
  key!: string;

  @IsNotEmpty()
  @IsString()
  value!: string;
}

class BaseExpenseDto {
  @IsOptional()
  @IsString()
  description?: string;

  @IsNotEmpty()
  @IsIn(['draft', 'pending', 'rejected', 'verified'])
  status!: ExpenseStatus;

  @IsOptional()
  @ArrayNotEmpty()
  @ValidateNested({ each: true })
  @Type(() => ExpenseItemDto)
  items?: ExpenseItemDto[];

  @IsOptional()
  @ArrayNotEmpty()
  @ValidateNested({ each: true })
  @Type(() => ExpenseOtherDetailDto)
  otherDetails?: ExpenseOtherDetailDto[];
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

  @IsNotEmpty()
  @IsString()
  merchantName!: string;

  @IsNotEmpty()
  @IsNumber({ maxDecimalPlaces: 2 })
  amount!: number;

  @IsNotEmpty()
  @IsDateString()
  date!: string;

  @IsOptional()
  @ArrayNotEmpty()
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
}

export class CreateManualExpenseDto extends BaseExpenseDto {
  @IsNotEmpty()
  @IsUUID('4')
  categoryId!: string;

  @IsNotEmpty()
  @IsString()
  merchantName!: string;

  @IsNotEmpty()
  @IsNumber({ maxDecimalPlaces: 2 })
  amount!: number;

  @IsNotEmpty()
  @IsDateString()
  date!: string;

  @IsOptional()
  @ArrayNotEmpty()
  @IsString({ each: true })
  photos?: string[];
}

export class CreateOcrExpenseDto extends BaseExpenseDto {
  @IsNotEmpty()
  @ArrayNotEmpty()
  @IsString({ each: true })
  photos!: string[];
}
