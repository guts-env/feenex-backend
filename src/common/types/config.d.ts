export interface IAwsConfig {
  region: string;
  s3: {
    bucket: string;
    presignedUrlExpiresIn: number;
  };
  credentials: {
    accessKeyId: string;
    secretAccessKey: string;
  };
}
