import {
  Injectable,
  ConflictException,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '@/modules/users/users.service';
import { PasswordService } from '@/modules/auth/password.service';
import UserRegisterDto from '@/modules/auth/dto/user-register.dto';
import { type AuthResponse } from '@/modules/auth/types/auth';
import { BaseUser, SecureUser } from '@/modules/users/types/users';
import omit from 'lodash/omit';

@Injectable()
export class AuthService {
  constructor(
    private readonly userService: UsersService,
    private readonly passwordService: PasswordService,
    private readonly jwtService: JwtService,
  ) {}

  async register(userRegisterDto: UserRegisterDto): Promise<void> {
    const { email: inputEmail, password: inputPassword } = userRegisterDto;

    const existingUser = await this.userService.findByEmail(inputEmail);

    if (existingUser) {
      throw new ConflictException({
        message: 'Email is already in use.',
      });
    }

    const hashedPassword = await this.passwordService.hash(inputPassword);

    await this.userService.create({
      email: inputEmail,
      password: hashedPassword,
    });
  }

  async validateUser(input: BaseUser): Promise<SecureUser> {
    const { email: inputEmail, password: inputPassword } = input;

    const user = await this.userService.findByEmail(inputEmail);

    if (!user) {
      throw new UnauthorizedException({
        message: 'Invalid credentials.',
      });
    }

    const isPasswordValid = await this.passwordService.compare(
      inputPassword,
      user.password,
    );

    if (!isPasswordValid) {
      throw new UnauthorizedException({
        message: 'Invalid credentials.',
      });
    }

    return omit(user, 'password');
  }

  authenticate(user: SecureUser): AuthResponse {
    const payload = { email: user.email, sub: user.id };

    return {
      accessToken: this.jwtService.sign(payload),
      user,
    };
  }
}
