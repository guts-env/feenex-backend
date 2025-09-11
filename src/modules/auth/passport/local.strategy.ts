import { Strategy } from 'passport-local';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { AuthService } from '@/modules/auth/auth.service';
import { type IUserPassport } from '@/modules/auth/types/auth';

@Injectable()
export class LocalStrategy extends PassportStrategy(Strategy) {
  constructor(private authService: AuthService) {
    super({
      usernameField: 'email',
    });
  }

  async validate(
    email: string,
    password: string,
  ): Promise<
    IUserPassport & {
      first_name: string;
      middle_name?: string | null;
      last_name?: string | null;
      profile_photo?: string | null;
    }
  > {
    const { user } = await this.authService.validateUser({ email, password });

    if (!user) {
      throw new UnauthorizedException();
    }

    const userPassport = {
      sub: user.id,
      email: user.email,
      first_name: user.first_name,
      middle_name: user.middle_name,
      last_name: user.last_name,
      profile_photo: user.profile_photo,
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
