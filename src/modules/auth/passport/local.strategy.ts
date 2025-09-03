import { Strategy } from 'passport-local';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable } from '@nestjs/common';
import { AuthService } from '@/modules/auth/auth.service';
import { type IUserPassport } from '@/modules/auth/types/auth';

@Injectable()
export class LocalStrategy extends PassportStrategy(Strategy) {
  constructor(private readonly authService: AuthService) {
    super({
      usernameField: 'email',
    });
  }

  async validate(email: string, password: string): Promise<IUserPassport> {
    const user = await this.authService.validateUser({ email, password });

    const userPassport = {
      sub: user.id,
      email: user.email,
      organization: {
        id: user.organization.id,
        name: user.organization.name,
        type: user.organization.type,
      },
      role: user.role,
    };

    return userPassport;
  }
}
