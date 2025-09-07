import {
  ArrayNotEmpty,
  IsDateString,
  IsDecimal,
  IsIn,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
} from 'class-validator';
import { Transform } from 'class-transformer';
import PaginatedDto from '@/common/dto/paginated.dto';
import { Expenses, ExpenseStatus } from '@/database/types/db';

export default class GetExpensesDto extends PaginatedDto<Expenses> {
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
  @IsIn(['draft', 'pending', 'rejected', 'verified'], { each: true })
  status?: ExpenseStatus[];

  @IsOptional()
  @IsString()
  @MaxLength(50, { message: 'Merchant name must be less than 50 characters' })
  merchantName?: string;
}
