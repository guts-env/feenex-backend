import { Expose } from 'class-transformer';
import { IsNotEmpty, IsString } from 'class-validator';

export class PresignedDownloadDto {
  @IsString({ each: true })
  @IsNotEmpty()
  keys!: string[];
}

export class PresignedDownloadResDto {
  @Expose()
  key!: string;

  @Expose()
  url!: string;

  @Expose()
  filename!: string;
}
