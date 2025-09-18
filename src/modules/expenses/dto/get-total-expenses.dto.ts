import { Expose, Type } from 'class-transformer';
import { DateRangeDto, DateRangeResDto } from '@/common/dto/date.dto';

export class GetTotalExpensesDto extends DateRangeDto {}

export class GetTotalExpensesResDto {
  @Expose()
  total?: number;

  @Expose()
  count?: number;

  @Expose()
  unverified?: number;

  @Expose()
  verified?: number;

  @Expose()
  receiptsProcessed?: number;

  @Expose()
  @Type(() => DateRangeResDto)
  dateRange?: DateRangeResDto;
}
