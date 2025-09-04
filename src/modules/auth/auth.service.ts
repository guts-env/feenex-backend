import {
  Injectable,
  ConflictException,
  UnauthorizedException,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '@/modules/users/users.service';
import { PasswordService } from '@/modules/auth/password.service';
import { OrganizationsService } from '@/modules/organizations/organizations.service';
import { InvitesService } from '@/modules/invites/invites.service';
import { AuthRepository } from '@/modules/auth/auth.repository';
import UserRegisterDto from '@/modules/auth/dto/user-register.dto';
import RegisterInvitedUserDto from '@/modules/auth/dto/register-invited-user.dto';
import { AccountTypeEnum } from '@/common/constants/enums';
import {
  type IUserPassport,
  type IValidateUserInput,
  type IAuthResponse,
} from '@/modules/auth/types/auth';
import { type IUser } from '@/modules/users/types/users';

import { TestEmailService } from '@/modules/upload/test-email.service';

@Injectable()
export class AuthService {
  constructor(
    private readonly inviteService: InvitesService,
    private readonly jwtService: JwtService,
    private readonly organizationService: OrganizationsService,
    private readonly passwordService: PasswordService,
    private readonly testEmailService: TestEmailService,
    private readonly userService: UsersService,
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
    await this.testEmailService.sendTestEmail(email);
  }

  async registerInvitedUser(dto: RegisterInvitedUserDto) {
    const { email, password, inviteId } = dto;

    const invite = await this.inviteService.findByEmail(email);
    if (!invite || invite.id !== inviteId) {
      throw new NotFoundException({
        message: 'No valid invite found.',
      });
    }

    const existingUser = await this.userService.findByEmail(email, true);
    if (existingUser) {
      throw new ConflictException({
        message: 'Email is already in use.',
      });
    }

    const organization = await this.organizationService.findById(
      invite.organization_id,
    );
    if (!organization) {
      throw new BadRequestException({
        message: 'Organization not found.',
      });
    }

    const hashedPassword = await this.passwordService.hash(password);
    const registrationPayload = {
      email,
      hashedPassword,
      orgId: invite.organization_id,
      accountType: AccountTypeEnum.BUSINESS,
    };

    await this.authRepository.createInvitedUser(registrationPayload, inviteId);
    await this.testEmailService.sendTestEmail(email);
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
