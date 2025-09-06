import { REQUEST } from '@nestjs/core';
import {
  ForbiddenException,
  Inject,
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
import { AWS_CONFIG_KEY } from '@/config/keys.config';
import {
  FILE_KEY_DOES_NOT_START_WITH_ORG_ID,
  GENERATE_PRESIGNED_URL_ERROR,
} from '@/common/constants/logger';
import PresignedUploadDto from '@/modules/upload/dto/presigned-upload.dto';
import { type IAwsConfig } from '@/common/types/config';
import { type IAuthenticatedRequest } from '@/modules/auth/types/auth';

@Injectable()
export class UploadService {
  private readonly client: S3Client;
  private readonly bucket: string;
  private readonly presignedUrlExpiry: number;
  private readonly logger = new Logger(UploadService.name);

  constructor(
    private readonly configService: ConfigService,
    @Inject(REQUEST) private readonly request: IAuthenticatedRequest,
  ) {
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
  ): Promise<string> {
    try {
      const command = new PutObjectCommand({
        Bucket: this.bucket,
        Key: this.generateKey(orgId, dto.key, dto.filename),
        ContentType: dto.contentType,
      });

      const presignedUrl = await getSignedUrl(this.client, command, {
        expiresIn: this.presignedUrlExpiry,
      });

      return presignedUrl;
    } catch (error) {
      this.logFileUploadEvent(
        GENERATE_PRESIGNED_URL_ERROR,
        this.formatError(error),
      );
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
        this.logFileUploadEvent(FILE_KEY_DOES_NOT_START_WITH_ORG_ID, {
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

      return { key, url: presignedUrl, filename };
    } catch (error) {
      this.logFileUploadEvent(
        GENERATE_PRESIGNED_URL_ERROR,
        this.formatError(error),
      );
      throw new InternalServerErrorException({
        message: 'Error generating download URL',
      });
    }
  }

  async createMultiplePresignedDownloadUrls(
    keys: string[],
    orgId: string,
  ): Promise<{ key: string; url: string; filename: string }[]> {
    try {
      const downloadPromises = keys.map((key) =>
        this.createPresignedGetUrl(key, orgId),
      );

      const files = await Promise.all(downloadPromises);

      return files;
    } catch (error) {
      this.logFileUploadEvent(
        GENERATE_PRESIGNED_URL_ERROR,
        this.formatError(error),
      );
      throw new InternalServerErrorException({
        message: 'Error generating download URL',
      });
    }
  }

  private generateKey(orgId: string, key: string, filename: string) {
    const parts = [orgId, key, filename]
      .map((p) => p.trim().replace(/^\/+|\/+$/g, ''))
      .filter(Boolean);
    return parts.join('/');
  }

  private logFileUploadEvent(
    event: string,
    additionalData?: Record<string, any>,
  ) {
    const request = this.request;

    this.logger.error({
      log: event,
      route: request.url,
      userId: request.user?.sub || 'unknown',
      userEmail: request.user?.email || 'unknown',
      userRole: request.user?.role?.name || 'unknown',
      userOrg: request.user?.organization?.id || 'unknown',
      method: request.method,
      ip: request.ip,
      userAgent: request.get('user-agent'),
      timestamp: new Date().toISOString(),
      ...additionalData,
    });
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
