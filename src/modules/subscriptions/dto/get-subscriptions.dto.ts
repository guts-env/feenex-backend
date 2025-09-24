import {
  ArrayNotEmpty,
  IsBoolean,
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
}
