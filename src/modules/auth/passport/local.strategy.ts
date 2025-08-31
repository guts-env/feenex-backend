import { Strategy } from 'passport-local';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable } from '@nestjs/common';
import { AuthService } from '@/modules/auth/auth.service';
import { SecureUser } from '@/modules/users/types/users';

@Injectable()
export class LocalStrategy extends PassportStrategy(Strategy) {
  constructor(private authService: AuthService) {
    super({
      usernameField: 'email',
    });
  }

  async validate(email: string, password: string): Promise<SecureUser> {
    const user = await this.authService.validateUser({ email, password });
    return user;
  }
}
