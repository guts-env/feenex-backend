import {
  Injectable,
  ConflictException,
  UnauthorizedException,
} from '@nestjs/common';
import { UsersService } from '@/modules/users/users.service';
import { PasswordService } from '@/modules/auth/password.service';
import UserRegisterDto from '@/modules/auth/dto/user-register.dto';
import { AuthInput, AuthResponse } from '@/modules/auth/types/auth';
import omit from 'lodash/omit';

@Injectable()
export class AuthService {
  constructor(
    private readonly userService: UsersService,
    private readonly passwordService: PasswordService,
  ) {}

  async register(userRegisterDto: UserRegisterDto) {
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

  async validateUser(input: AuthInput) {
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

  async authenticate(input: AuthInput): Promise<AuthResponse> {
    const user = await this.validateUser(input);

    return {
      accessToken: 'todo: replace this',
      userId: user.id,
      email: user.email,
    };
  }
}
