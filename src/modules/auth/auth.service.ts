import {
  Injectable,
  ConflictException,
  UnauthorizedException,
  BadRequestException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '@/modules/users/users.service';
import { PasswordService } from '@/modules/auth/password.service';
import { AuthRepository } from '@/modules/auth/auth.repository';
import UserRegisterDto from '@/modules/auth/dto/user-register.dto';
import {
  type IUserPassport,
  type IValidateUserInput,
  type IAuthResponse,
} from '@/modules/auth/types/auth';
import { type IUser } from '@/modules/users/types/users';
import { AccountTypeEnum } from '@/common/constants/enums';

@Injectable()
export class AuthService {
  constructor(
    private readonly userService: UsersService,
    private readonly passwordService: PasswordService,
    private readonly jwtService: JwtService,
    private readonly authRepository: AuthRepository,
  ) {}

  async register(dto: UserRegisterDto): Promise<void> {
    const { email, password, accountType, organizationName } = dto;

    const existingUser = await this.userService.findByEmail(email, true);

    if (existingUser) {
      throw new ConflictException({
        message: 'Email is already in use.',
      });
    }

    if (accountType === AccountTypeEnum.BUSINESS && !organizationName) {
      throw new BadRequestException({
        message: 'Business name is required.',
      });
    }

    const personalOrgName = email.split('@')[0];

    const businessName =
      accountType === AccountTypeEnum.BUSINESS
        ? organizationName
        : personalOrgName;

    const hashedPassword = await this.passwordService.hash(password);

    const registrationPayload = {
      email,
      hashedPassword,
      organizationName: businessName,
      accountType,
    };

    await this.authRepository.create(registrationPayload);
  }

  async validateUser(input: IValidateUserInput): Promise<IUser> {
    const { email: inputEmail, password: inputPassword } = input;

    const user = await this.userService.findByEmail(inputEmail);

    if (!user) {
      throw new UnauthorizedException({
        message: 'Invalid credentials.',
      });
    }

    if (!user.organization.id) {
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

  authenticate(user: IUserPassport): IAuthResponse {
    return {
      accessToken: this.jwtService.sign(user),
      user,
    };
  }
}
