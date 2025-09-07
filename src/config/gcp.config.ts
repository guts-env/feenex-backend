import { registerAs } from '@nestjs/config';
import { IGcpConfig, IGcpCredentials } from '@/common/types/config';
import { GCP_CONFIG_KEY } from '@/config/keys.config';

export default registerAs<IGcpConfig>(GCP_CONFIG_KEY, () => {
  const { GCP_CREDENTIALS } = process.env;

  const missingCreds = ['GCP_CREDENTIALS'].filter(
    (varName) => !process.env[varName],
  );

  if (missingCreds.length > 0) {
    throw new Error(
      `Missing required GCP environment variables: ${missingCreds.join(', ')}`,
    );
  }

  const credentialsStr = Buffer.from(
    GCP_CREDENTIALS as string,
    'base64',
  ).toString();
  const credentials = JSON.parse(credentialsStr) as IGcpCredentials;

  return {
    credentials,
  };
});
