import {
  ArrayNotEmpty,
  IsDateString,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { CurrencyCodeEnum, ExpenseSourceEnum } from '@/common/constants/enums';

export class ExpenseItemDto {
  @IsNotEmpty()
  @IsString()
  name: string;

  @IsNotEmpty()
  @IsNumber()
  quantity: number;

  @IsNotEmpty()
  @IsNumber({ maxDecimalPlaces: 2 })
  price: number;
}

export class ExpenseOtherDetailDto {
  @IsNotEmpty()
  @IsString()
  key: string;

  @IsNotEmpty()
  @IsString()
  value: string;
}

class BaseExpenseDto {
  @IsOptional()
  @IsString()
  description?: string;

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
  @IsEnum(ExpenseSourceEnum)
  source: ExpenseSourceEnum;

  @IsNotEmpty()
  @IsUUID('4')
  categoryId: string;

  @IsNotEmpty()
  @IsString()
  merchantName: string;

  @IsNotEmpty()
  @IsNumber({ maxDecimalPlaces: 2 })
  amount: string;

  @IsNotEmpty()
  @IsDateString()
  date: string;

  @IsOptional()
  @ArrayNotEmpty()
  @IsString({ each: true })
  photos?: string[];

  @IsOptional()
  @IsEnum(CurrencyCodeEnum)
  currency?: CurrencyCodeEnum;

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
  categoryId: string;

  @IsNotEmpty()
  @IsString()
  merchantName: string;

  @IsNotEmpty()
  @IsNumber({ maxDecimalPlaces: 2 })
  amount: string;

  @IsNotEmpty()
  @IsDateString()
  date: string;

  @IsOptional()
  @ArrayNotEmpty()
  @IsString({ each: true })
  photos?: string[];
}

export class CreateOcrExpenseDto extends BaseExpenseDto {
  @IsNotEmpty()
  @ArrayNotEmpty()
  @IsString({ each: true })
  photos: string[];
}
