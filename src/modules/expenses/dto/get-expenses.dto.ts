import {
  ArrayNotEmpty,
  IsDate,
  IsDecimal,
  IsIn,
  IsOptional,
  // IsString,
  IsUUID,
  // MaxLength,
} from 'class-validator';
import { Transform } from 'class-transformer';
import PaginatedDto from '@/common/dto/paginated.dto';
import { Expenses, ExpenseStatus } from '@/database/types/db';

export default class GetExpensesDto extends PaginatedDto<Expenses> {
  @IsOptional()
  @ArrayNotEmpty()
  @IsUUID('4', { each: true })
  categoryIds?: string[];

  // @IsOptional()
  // @ArrayNotEmpty()
  // @IsUUID('4', { each: true })
  // createdByUsers?: string[];

  // @IsOptional()
  // @ArrayNotEmpty()
  // @IsUUID('4', { each: true })
  // verifiedByUsers?: string[];

  @IsOptional()
  @Transform(({ value }: { value: string }) => {
    return value ? new Date(value) : value;
  })
  @IsDate()
  startDate?: Date;

  @IsOptional()
  @Transform(({ value }: { value: string }) =>
    value ? new Date(value) : value,
  )
  @IsDate()
  endDate?: Date;

  @IsOptional()
  @Transform(({ value }: { value: string }) =>
    value ? parseFloat(value).toFixed(2) : value,
  )
  @IsDecimal({ decimal_digits: '0,2', force_decimal: false })
  minAmount?: string;

  @IsOptional()
  @Transform(({ value }: { value: string }) =>
    value ? parseFloat(value).toFixed(2) : value,
  )
  @IsDecimal({ decimal_digits: '0,2', force_decimal: false })
  maxAmount?: string;

  @IsOptional()
  @ArrayNotEmpty()
  @IsIn(['draft', 'pending', 'rejected', 'verified'], { each: true })
  statuses?: ExpenseStatus[];

  // @IsOptional()
  // @IsString()
  // @MaxLength(50, { message: 'Merchant name must be less than 50 characters' })
  // merchantName?: string;
}
