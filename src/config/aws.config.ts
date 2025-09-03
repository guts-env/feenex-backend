import { registerAs } from '@nestjs/config';
import { IAwsConfig } from '@/common/types/config';
import { AWS_CONFIG_KEY } from '@/config/keys.config';

export default registerAs(AWS_CONFIG_KEY, (): IAwsConfig => {
  const {
    AWS_REGION,
    AWS_S3_BUCKET,
    AWS_S3_PRESIGNED_EXPIRY,
    AWS_ACCESS_KEY_ID,
    AWS_SECRET_ACCESS_KEY,
  } = process.env;

  const missingCreds = [
    'AWS_REGION',
    'AWS_S3_BUCKET',
    'AWS_S3_PRESIGNED_EXPIRY',
    'AWS_ACCESS_KEY_ID',
    'AWS_SECRET_ACCESS_KEY',
  ].filter((varName) => !process.env[varName]);

  if (missingCreds.length > 0) {
    throw new Error(
      `Missing required AWS environment variables: ${missingCreds.join(', ')}`,
    );
  }

  if (isNaN(+AWS_S3_PRESIGNED_EXPIRY!)) {
    throw new Error(`Invalid S3 presigned expiry.`);
  }

  return {
    region: AWS_REGION!,
    s3: {
      bucket: AWS_S3_BUCKET!,
      presignedUrlExpiresIn: +AWS_S3_PRESIGNED_EXPIRY!,
    },
    credentials: {
      accessKeyId: AWS_ACCESS_KEY_ID!,
      secretAccessKey: AWS_SECRET_ACCESS_KEY!,
    },
  };
});
