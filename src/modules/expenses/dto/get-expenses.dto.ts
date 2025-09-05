import {
  ArrayNotEmpty,
  IsDateString,
  IsDecimal,
  IsEnum,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
} from 'class-validator';
import { Transform } from 'class-transformer';
import PaginatedDto from '@/common/dto/paginated.dto';
import { ExpenseStatusEnum } from '@/common/constants/enums';

export default class GetExpensesDto extends PaginatedDto {
  @IsOptional()
  @ArrayNotEmpty()
  @IsUUID('4', { each: true })
  categories?: string[];

  @IsOptional()
  @ArrayNotEmpty()
  @IsUUID('4', { each: true })
  createdByUsers?: string[];

  @IsOptional()
  @ArrayNotEmpty()
  @IsUUID('4', { each: true })
  verifiedByUsers?: string[];

  @IsOptional()
  @Transform(({ value }: { value: string }) =>
    value ? new Date(value) : value,
  )
  @IsDateString()
  startDate?: Date;

  @IsOptional()
  @Transform(({ value }: { value: string }) =>
    value ? new Date(value) : value,
  )
  @IsDateString()
  endDate?: Date;

  @IsOptional()
  @IsDecimal({ decimal_digits: '2', force_decimal: true })
  minAmount?: string;

  @IsOptional()
  @IsDecimal({ decimal_digits: '2', force_decimal: true })
  maxAmount?: string;

  @IsOptional()
  @ArrayNotEmpty()
  @IsEnum(ExpenseStatusEnum, { each: true })
  status?: ExpenseStatusEnum[];

  @IsOptional()
  @IsString()
  @MaxLength(50, { message: 'Merchant name must be less than 50 characters' })
  merchantName?: string;
}

export type GetExpensesDtoValue = GetExpensesDto[keyof GetExpensesDto];
export type GetExpensesDtoValues = GetExpensesDtoValue[];
