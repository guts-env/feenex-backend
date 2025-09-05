import { IsNumber, IsOptional, IsString, MaxLength } from 'class-validator';

export default class PaginatedDto {
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
  @IsString()
  @MaxLength(50, { message: 'Sort order must be less than 50 characters' })
  sortOrder?: string;

  @IsOptional()
  @IsString()
  @MaxLength(50, { message: 'Sort by must be less than 50 characters' })
  sortBy?: string;
}
