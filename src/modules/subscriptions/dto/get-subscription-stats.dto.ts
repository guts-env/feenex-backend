import { IsDate, IsOptional } from 'class-validator';
import { Expose, Transform } from 'class-transformer';

export class GetSubscriptionStatsDto {
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
}

export class GetSubscriptionStatsResDto {
  @Expose()
  activeCount!: number;

  @Expose()
  activeAmount!: number;

  @Expose()
  suspendedCount!: number;

  @Expose()
  cancelledCount!: number;
}
