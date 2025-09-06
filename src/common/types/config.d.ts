export interface IAwsConfig {
  region: string;
  s3: {
    bucket: string;
    presignedUrlExpiresIn: number;
  };
  ses: {
    sourceEmail: string;
  };
  credentials: {
    accessKeyId: string;
    secretAccessKey: string;
  };
  textract?: {
    maxRetries: number;
    timeout: number;
  };
}
