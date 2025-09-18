import { Expose } from 'class-transformer';
import { IsOptional, IsString } from 'class-validator';

export class DateRangeDto {
  @IsOptional()
  @IsString()
  startDate?: string;

  @IsOptional()
  @IsString()
  endDate?: string;
}

export class DateRangeResDto {
  @Expose()
  startDate?: Date;

  @Expose()
  endDate?: Date;
}
