import { Transform, Type } from 'class-transformer';
import {
  IsIn,
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
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
  @IsNumber()
  offset?: number;

  @IsOptional()
  @IsNumber()
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
