import { Expose } from 'class-transformer';
import { IsNotEmpty, IsString } from 'class-validator';

export class RefreshTokenDto {
  @IsString()
  @IsNotEmpty()
  refreshToken!: string;
}

export class RefreshTokenResDto {
  @Expose()
  accessToken!: string;

  @Expose()
  refreshToken!: string;
}
