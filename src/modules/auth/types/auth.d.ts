import { SecureUser } from '@/modules/users/types/users';

export type AuthResponse = {
  accessToken: string;
  user: Partial<SecureUser>;
};

export interface AuthenticatedRequest extends Request {
  user: SecureUser;
}
