import {
  ArrayNotEmpty,
  IsBoolean,
  IsDate,
  IsIn,
  IsOptional,
  IsUUID,
} from 'class-validator';
import { Transform } from 'class-transformer';
import PaginatedDto from '@/common/dto/paginated.dto';
import { Subscriptions } from '@/database/types/db';

export class GetSubscriptionsDto extends PaginatedDto<Subscriptions> {
  @IsOptional()
  @ArrayNotEmpty()
  @IsUUID('4', { each: true })
  categoryIds?: string[];

  @IsOptional()
  @ArrayNotEmpty()
  @IsIn(['active', 'suspended', 'cancelled'], { each: true })
  statuses?: ('active' | 'suspended' | 'cancelled')[];

  @IsOptional()
  @IsIn(['daily', 'weekly', 'monthly', 'yearly'])
  frequency?: 'daily' | 'weekly' | 'monthly' | 'yearly';

  @IsOptional()
  @Transform(({ value }) => value === 'true')
  @IsBoolean()
  isVat?: boolean;

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
  @Transform(({ value }: { value: string }) => {
    return value ? new Date(value) : value;
  })
  @IsDate()
  billingStartDate?: Date;

  @IsOptional()
  @Transform(({ value }: { value: string }) =>
    value ? new Date(value) : value,
  )
  @IsDate()
  billingEndDate?: Date;
}
