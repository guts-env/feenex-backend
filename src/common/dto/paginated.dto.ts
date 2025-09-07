import { Transform, Type } from 'class-transformer';
import {
  IsIn,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';

class OrderByDto<T> {
  @IsString()
  @MaxLength(50, { message: 'Order by field must be less than 50 characters' })
  field!: keyof T;

  @IsIn(['asc', 'desc'])
  @Transform(({ value }: { value: string }) => value || 'desc')
  order!: 'asc' | 'desc';
}

export default class PaginatedDto<T> {
  @IsOptional()
  @Transform(({ value }: { value: string }) =>
    value ? parseInt(value, 10) : undefined,
  )
  @IsNumber()
  @Max(50, { message: 'Offset must be at most 50' })
  offset?: number;

  @IsOptional()
  @Transform(({ value }: { value: string }) =>
    value ? parseInt(value, 10) : undefined,
  )
  @IsNumber()
  @Min(1, { message: 'Limit must be at least 1' })
  @Max(50, { message: 'Limit must be at most 50' })
  limit?: number;

  @IsOptional()
  @IsString()
  @MaxLength(50, { message: 'Search string must be less than 50 characters' })
  search?: string;

  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => OrderByDto<T>)
  orderBy?: OrderByDto<T>;
}
