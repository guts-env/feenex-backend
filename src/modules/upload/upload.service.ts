import {
  ForbiddenException,
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import {
  GetObjectCommand,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { ConfigService } from '@nestjs/config';
import { plainToInstance } from 'class-transformer';
import { AWS_CONFIG_KEY } from '@/config/keys.config';
import {
  FILE_KEY_DOES_NOT_START_WITH_ORG_ID,
  GENERATE_PRESIGNED_URL_ERROR,
} from '@/common/constants/logger';
import PresignedUploadDto, {
  PresignedUploadResDto,
} from '@/modules/upload/dto/presigned-upload.dto';
import { PresignedDownloadResDto } from '@/modules/upload/dto/presigned-download.dto';
import { type IAwsConfig } from '@/common/types/config';

@Injectable()
export class UploadService {
  private readonly client: S3Client;
  private readonly bucket: string;
  private readonly presignedUrlExpiry: number;
  private readonly logger = new Logger(UploadService.name);

  constructor(private readonly configService: ConfigService) {
    const awsConfig = this.configService.get<IAwsConfig>(AWS_CONFIG_KEY)!;

    this.client = new S3Client({
      region: awsConfig.region,
      credentials: awsConfig.credentials,
    });

    this.bucket = awsConfig.s3.bucket;
    this.presignedUrlExpiry = awsConfig.s3.presignedUrlExpiresIn;
  }

  async createPresignedUrl(
    dto: PresignedUploadDto,
    orgId: string,
  ): Promise<PresignedUploadResDto> {
    try {
      const key = this.generateKey(
        orgId,
        dto.key,
        `${Date.now()}-${dto.filename}`,
      );

      const command = new PutObjectCommand({
        Bucket: this.bucket,
        Key: key,
        ContentType: dto.contentType,
      });

      const presignedUrl = await getSignedUrl(this.client, command, {
        expiresIn: this.presignedUrlExpiry,
      });

      return plainToInstance(PresignedUploadResDto, {
        key,
        url: presignedUrl,
      });
    } catch (error) {
      this.logger.error(GENERATE_PRESIGNED_URL_ERROR, this.formatError(error));
      throw new InternalServerErrorException({
        message: 'Something went wrong while uploading file',
      });
    }
  }

  async createPresignedGetUrl(
    key: string,
    orgId: string,
  ): Promise<{ key: string; url: string; filename: string }> {
    try {
      if (!key.startsWith(orgId)) {
        this.logger.error(FILE_KEY_DOES_NOT_START_WITH_ORG_ID, {
          key,
          orgId,
        });

        throw new ForbiddenException({
          message: 'Key does not start with orgId',
        });
      }

      const command = new GetObjectCommand({
        Bucket: this.bucket,
        Key: key,
      });

      const presignedUrl = await getSignedUrl(this.client, command, {
        expiresIn: this.presignedUrlExpiry,
      });

      const filename = key.split('/').pop()!;

      return plainToInstance(PresignedDownloadResDto, {
        key,
        url: presignedUrl,
        filename,
      });
    } catch (error) {
      this.logger.error(GENERATE_PRESIGNED_URL_ERROR, this.formatError(error));
      throw new InternalServerErrorException({
        message: 'Error generating download URL',
      });
    }
  }

  async createMultiplePresignedDownloadUrls(
    keys: string[],
    orgId: string,
  ): Promise<PresignedDownloadResDto[]> {
    try {
      const downloadPromises = keys.map((key) =>
        this.createPresignedGetUrl(key, orgId),
      );

      const files = await Promise.all(downloadPromises);

      return plainToInstance(PresignedDownloadResDto, files);
    } catch (error) {
      this.logger.error(GENERATE_PRESIGNED_URL_ERROR, this.formatError(error));
      throw new InternalServerErrorException({
        message: 'Error generating download URL',
      });
    }
  }

  private generateKey(orgId: string, key: string, filename: string) {
    const parts = [orgId, key, filename]
      .map((p) =>
        p
          .trim()
          .replace(/^\/+|\/+$/g, '')
          .replace(/\s+/g, '-'),
      )
      .filter(Boolean);
    return parts.join('/');
  }

  private formatError(error: unknown) {
    return {
      name:
        typeof error === 'object' && error !== null && 'name' in error
          ? (error as { name?: unknown }).name
          : undefined,
      message:
        typeof error === 'object' && error !== null && 'message' in error
          ? (error as { message?: unknown }).message
          : undefined,
      status:
        typeof error === 'object' && error !== null && '$metadata' in error
          ? (error as { $metadata?: { httpStatusCode?: unknown } }).$metadata
              ?.httpStatusCode
          : undefined,
    };
  }
}
