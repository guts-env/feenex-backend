import { IsNumber, IsOptional } from 'class-validator';

export default class PaginatedDto {
  @IsNumber()
  @IsOptional()
  offset: number;

  @IsNumber()
  @IsOptional()
  limit: number;
}
