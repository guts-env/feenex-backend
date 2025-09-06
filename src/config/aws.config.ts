import { registerAs } from '@nestjs/config';
import { IAwsConfig } from '@/common/types/config';
import { AWS_CONFIG_KEY } from '@/config/keys.config';

export default registerAs<IAwsConfig>(AWS_CONFIG_KEY, () => {
  const {
    AWS_REGION,
    AWS_S3_BUCKET,
    AWS_S3_PRESIGNED_EXPIRY,
    AWS_ACCESS_KEY_ID,
    AWS_SECRET_ACCESS_KEY,
    AWS_SES_SOURCE_EMAIL,
  } = process.env;

  /* TODO: do not require keys in deployed environments, let AWS supply */
  const missingCreds = [
    'AWS_REGION',
    'AWS_S3_BUCKET',
    'AWS_S3_PRESIGNED_EXPIRY',
    'AWS_ACCESS_KEY_ID',
    'AWS_SECRET_ACCESS_KEY',
    'AWS_SES_SOURCE_EMAIL',
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
    ses: {
      sourceEmail: AWS_SES_SOURCE_EMAIL!,
    },
    credentials: {
      accessKeyId: AWS_ACCESS_KEY_ID!,
      secretAccessKey: AWS_SECRET_ACCESS_KEY!,
    },
    textract: {
      maxRetries: 3,
      timeout: 30000, // 30 seconds
    },
  };
});
