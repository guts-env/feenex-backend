import {
  Injectable,
  ConflictException,
  UnauthorizedException,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { plainToInstance } from 'class-transformer';
import { UsersService } from '@/modules/users/users.service';
import { PasswordService } from '@/modules/auth/password.service';
import { OrganizationsService } from '@/modules/organizations/organizations.service';
import { InvitesService } from '@/modules/invites/invites.service';
import { AuthRepository } from '@/modules/auth/auth.repository';
import UserRegisterDto from '@/modules/auth/dto/user-register.dto';
import RegisterInvitedUserDto from '@/modules/auth/dto/accept-invite.dto';
import UserLoginResDto from '@/modules/auth/dto/user-login-res.dto';
import RequestResetPasswordDto from '@/modules/auth/dto/request-reset-password.dto';
import ResetPasswordDto from '@/modules/auth/dto/reset-password.dto';
import UpdatePasswordDto from '@/modules/auth/dto/update-password.dto';
import {
  type IAuthUser,
  type IUserPassport,
  type IValidateUserInput,
} from '@/modules/auth/types/auth';
import { type IUser } from '@/modules/users/types/users';
import { createHash, randomBytes } from 'crypto';

@Injectable()
export class AuthService {
  constructor(
    private readonly inviteService: InvitesService,
    private readonly jwtService: JwtService,
    private readonly organizationService: OrganizationsService,
    private readonly passwordService: PasswordService,
    private readonly userService: UsersService,
    private readonly authRepository: AuthRepository,
  ) {}

  async findByUserId(userId: string): Promise<IAuthUser> {
    const auth = await this.authRepository.findByUserId(userId);

    if (!auth) {
      throw new UnauthorizedException({
        message: 'Account not activated.',
      });
    }

    return auth;
  }

  async register(dto: UserRegisterDto): Promise<void> {
    const { email, password, orgType, organizationName } = dto;

    const existingUser = await this.userService.findByEmail(email, true);
    if (existingUser) {
      throw new ConflictException({
        message: 'Email is already in use.',
      });
    }

    if (orgType === 'business' && !organizationName) {
      throw new BadRequestException({
        message: 'Business name is required.',
      });
    }

    const personalOrgName = email.split('@')[0];

    const businessName =
      orgType === 'business' ? organizationName : personalOrgName;

    const hashedPassword = await this.passwordService.hash(password);

    const registrationPayload = {
      email,
      hashedPassword,
      organizationName: businessName,
      orgType,
    };

    await this.authRepository.create(registrationPayload);
  }

  async registerInvitedUser(dto: RegisterInvitedUserDto) {
    const { email, password, inviteToken } = dto;

    const invite = await this.inviteService.findByToken(inviteToken);
    if (!invite) {
      throw new NotFoundException({
        message: 'No valid invite found.',
      });
    }

    if (invite.email !== email) {
      throw new BadRequestException({
        message: 'Email does not match invite.',
      });
    }

    const expiresAt = new Date(invite.expires_at);
    const now = new Date();
    if (expiresAt < now) {
      throw new BadRequestException({
        message: 'Invite has expired.',
      });
    }

    if (invite.used) {
      throw new BadRequestException({
        message: 'Invite has already been used.',
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
      orgType: organization.type,
    };

    await this.authRepository.createInvitedUser(registrationPayload, invite.id);
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

    const auth = await this.findByUserId(user.id);

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

  authenticate(user: IUserPassport): UserLoginResDto {
    return plainToInstance(UserLoginResDto, {
      accessToken: this.jwtService.sign(user),
      user,
    });
  }

  async requestResetPassword(dto: RequestResetPasswordDto): Promise<string> {
    const { email } = dto;

    const user = await this.userService.findByEmail(email);
    if (!user) {
      throw new NotFoundException({ message: 'User does not exist.' });
    }

    const auth = await this.findByUserId(user.id);
    if (!auth) {
      throw new UnauthorizedException({
        message: 'Account not activated.',
      });
    }

    const resetToken = this.generateResetPasswordToken();
    const resetLink = `https://feenex.com/auth/reset-password?prt=${resetToken}`;

    const hashedToken = this.hashToken(resetToken);
    await this.authRepository.requestResetPassword(auth.id, hashedToken);

    return resetLink;
  }

  async updatePassword(dto: UpdatePasswordDto) {
    const { email, currentPassword, newPassword } = dto;

    const user = await this.validateUser({
      email,
      password: currentPassword,
    });

    const auth = await this.findByUserId(user.id);
    if (!auth) {
      throw new UnauthorizedException({
        message: 'Account not activated.',
      });
    }

    await this.checkIfPasswordIsSameAsCurrent(newPassword, auth.password);
    const hashedPassword = await this.passwordService.hash(newPassword);
    await this.authRepository.updatePassword(auth.id, hashedPassword);
  }

  async resetPassword(dto: ResetPasswordDto) {
    const { email, newPassword, resetToken } = dto;

    const user = await this.userService.findByEmail(email);
    if (!user) {
      throw new NotFoundException({ message: 'User does not exist.' });
    }

    const auth = await this.findByUserId(user.id);
    if (!auth) {
      throw new UnauthorizedException({
        message: 'Account not activated.',
      });
    }

    if (!auth.reset_password_token || !auth.reset_password_token_expires_at) {
      throw new BadRequestException({
        message: 'Invalid reset request.',
      });
    }

    if (auth.reset_password_token_expires_at < new Date()) {
      throw new BadRequestException({
        message: 'Reset password request has expired.',
      });
    }

    const hashedToken = this.hashToken(resetToken);
    if (auth.reset_password_token !== hashedToken) {
      throw new BadRequestException({
        message: 'Invalid reset token.',
      });
    }

    await this.checkIfPasswordIsSameAsCurrent(newPassword, auth.password);
    const hashedPassword = await this.passwordService.hash(newPassword);
    await this.authRepository.resetPassword(auth.id, hashedPassword);
  }

  private async checkIfPasswordIsSameAsCurrent(
    password: string,
    hashedPassword: string,
  ): Promise<boolean> {
    const isPasswordSameAsCurrent = await this.passwordService.compare(
      password,
      hashedPassword,
    );

    if (isPasswordSameAsCurrent) {
      throw new BadRequestException({
        message: `Choose a password you haven't used before.`,
      });
    }

    return isPasswordSameAsCurrent;
  }

  private generateResetPasswordToken(): string {
    const token = randomBytes(32).toString('base64url');
    return token;
  }

  private hashToken(token: string): string {
    return createHash('sha256').update(token).digest('hex');
  }
}
