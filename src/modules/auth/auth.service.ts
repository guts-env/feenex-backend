import {
  Injectable,
  ConflictException,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '@/modules/users/users.service';
import { PasswordService } from '@/modules/auth/password.service';
import { AuthRepository } from '@/modules/auth/auth.repository';
import UserRegisterDto from '@/modules/auth/dto/user-register.dto';
import {
  JwtPayload,
  ValidateUserInput,
  type AuthResponse,
} from '@/modules/auth/types/auth';
import { User } from '@/modules/users/types/users';

@Injectable()
export class AuthService {
  constructor(
    private readonly userService: UsersService,
    private readonly passwordService: PasswordService,
    private readonly jwtService: JwtService,
    private readonly authRepository: AuthRepository,
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
      hashed_password: hashedPassword,
    });
  }

  async validateUser(input: ValidateUserInput): Promise<User> {
    const { email: inputEmail, password: inputPassword } = input;

    const user = await this.userService.findByEmail(inputEmail);

    if (!user) {
      throw new UnauthorizedException({
        message: 'Invalid credentials.',
      });
    }

    const auth = await this.authRepository.findByUserId(user.id);

    if (!auth) {
      throw new UnauthorizedException({
        message: 'Account not activated.',
      });
    }

    const isPasswordValid = await this.passwordService.compare(
      inputPassword,
      auth.password,
    );

    if (!isPasswordValid) {
      throw new UnauthorizedException({
        message: 'Invalid credentials.',
      });
    }

    return user;
  }

  authenticate(user: User): AuthResponse {
    const payload: JwtPayload = { email: user.email, sub: user.id };

    return {
      accessToken: this.jwtService.sign(payload),
      user,
    };
  }
}
