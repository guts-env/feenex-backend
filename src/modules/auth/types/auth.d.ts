import { BaseRepository } from '@/modules/base/base.repository';
import { User } from '@/modules/users/types/users';

export interface ValidateUserInput {
  email: string;
  password: string;
}

export interface AuthUser extends BaseRepository {
  id: string;
  user_id: string;
  password: string;
}

export type AuthResponse = {
  accessToken: string;
  user: Partial<User>;
};

export interface AuthenticatedRequest extends Request {
  user: User;
}

export interface JwtPayload {
  email: string;
  sub: string;
}

export interface ValidatedJwtPayload extends Request {
  user: JwtPayload;
}
