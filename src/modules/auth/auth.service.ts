import {
  Injectable,
  ConflictException,
  UnauthorizedException,
  BadRequestException,
  NotFoundException,
  Logger,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { createHash, randomBytes } from 'crypto';
import { plainToInstance } from 'class-transformer';
import { RESET_PASSWORD_REDIRECT_URL_CONFIG_KEY } from '@/config/keys.config';
import { UsersService } from '@/modules/users/users.service';
import { PasswordService } from '@/modules/auth/password.service';
import { OrganizationsService } from '@/modules/organizations/organizations.service';
import { InvitesService } from '@/modules/invites/invites.service';
import { RefreshTokenService } from '@/modules/auth/refresh-token.service';
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
import { isAfter } from 'date-fns';

@Injectable()
export class AuthService {
  private readonly resetPasswordRedirectUrl: string;
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly inviteService: InvitesService,
    private readonly jwtService: JwtService,
    private readonly organizationService: OrganizationsService,
    private readonly passwordService: PasswordService,
    private readonly userService: UsersService,
    private readonly refreshTokenService: RefreshTokenService,
    private readonly authRepository: AuthRepository,
    private readonly configService: ConfigService,
  ) {
    this.resetPasswordRedirectUrl = this.configService.get<string>(
      RESET_PASSWORD_REDIRECT_URL_CONFIG_KEY,
    )!;
  }

  async register(dto: UserRegisterDto): Promise<void> {
    const {
      email,
      password,
      orgType,
      orgName,
      firstName,
      lastName,
      middleName,
    } = dto;

    const existingUser = await this.userService.findByEmail(email, true);
    if (existingUser) {
      throw new ConflictException({
        message: 'Email is already in use.',
      });
    }

    if (orgType === 'business' && !orgName) {
      throw new BadRequestException({
        message: 'Business name is required.',
      });
    }

    const personalOrgName = email.split('@')[0];

    const businessName = orgType === 'business' ? orgName : personalOrgName;

    const hashedPassword = await this.passwordService.hash(password);

    const registrationPayload = {
      firstName,
      lastName,
      middleName,
      email,
      hashedPassword,
      orgName: businessName,
      orgType,
    };

    await this.authRepository.create(registrationPayload);
  }

  async registerInvitedUser(dto: RegisterInvitedUserDto) {
    const { password, inviteToken, firstName, lastName, middleName } = dto;

    const invite = await this.inviteService.findByToken(inviteToken);
    if (!invite) {
      throw new NotFoundException({
        message: 'No valid invite found.',
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

    const existingUser = await this.userService.findByEmail(invite.email, true);
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
      firstName,
      lastName,
      middleName,
      email: invite.email,
      hashedPassword,
      orgId: invite.organization_id,
      orgType: organization.type,
    };

    await this.authRepository.createInvitedUser(registrationPayload, invite.id);
  }

  async validateUser(
    input: IValidateUserInput,
  ): Promise<{ user: IUser; auth: IAuthUser }> {
    const { email: inputEmail, password: inputPassword } = input;

    const result =
      await this.authRepository.findUserWithAuthByEmail(inputEmail);

    if (!result) {
      throw new UnauthorizedException({
        message: 'Invalid credentials.',
      });
    }

    const isPasswordValid = await this.passwordService.compare(
      inputPassword,
      result.auth.password,
    );

    if (!isPasswordValid) {
      throw new UnauthorizedException({
        message: 'Invalid credentials.',
      });
    }

    return { user: result.user, auth: result.auth };
  }

  async authenticate(
    user: IUserPassport & {
      first_name: string;
      middle_name?: string | null;
      last_name?: string | null;
      profile_photo?: string | null;
    },
  ): Promise<UserLoginResDto> {
    // Check and migrate beta plan to free if after October 27, 2025
    await this.checkAndMigrateBetaPlan(user.organization.id);

    const accessToken = this.jwtService.sign(user);
    const refreshToken = await this.refreshTokenService.generateRefreshToken(
      user.sub,
    );

    return plainToInstance(UserLoginResDto, {
      accessToken,
      refreshToken,
      user: {
        id: user.sub,
        email: user.email,
        firstName: user.first_name,
        middleName: user.middle_name,
        lastName: user.last_name,
        profilePhoto: user.profile_photo,
        role: user.role,
        organization: user.organization,
      },
    });
  }

  private async checkAndMigrateBetaPlan(organizationId: string): Promise<void> {
    try {
      const cutoffDate = new Date('2025-09-16');
      const currentDate = new Date();

      if (!isAfter(currentDate, cutoffDate)) {
        return;
      }

      const organization =
        await this.organizationService.getOrganizationWithPlan(organizationId);

      if (!organization?.account_plan_id) {
        return;
      }

      await this.authRepository.migrateBetaPlanToFree(organizationId);
    } catch (error) {
      this.logger.error(
        `Failed to migrate beta plan for organization ${organizationId}:`,
        error,
      );
    }
  }

  async refreshAccessToken(
    refreshToken: string,
  ): Promise<{ accessToken: string; refreshToken: string }> {
    const tokenData =
      await this.refreshTokenService.validateRefreshToken(refreshToken);

    const newRefreshToken = await this.refreshTokenService.rotateRefreshToken(
      tokenData,
      refreshToken,
    );

    const result = await this.authRepository.findUserWithAuthByUserId(
      tokenData.userId,
    );

    const { user } = result || {};
    if (!user) {
      await this.refreshTokenService.revokeRefreshToken(newRefreshToken);
      throw new UnauthorizedException({ message: 'User not found' });
    }

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

    const accessToken = this.jwtService.sign(userPassport);

    return { accessToken, refreshToken: newRefreshToken };
  }

  async logout(refreshToken: string): Promise<void> {
    await this.refreshTokenService.revokeRefreshToken(refreshToken);
  }

  async logoutAllDevices(userId: string): Promise<void> {
    await this.refreshTokenService.revokeAllUserTokens(userId);
  }

  async requestResetPassword(dto: RequestResetPasswordDto): Promise<string> {
    const { email } = dto;

    const result = await this.authRepository.findUserWithAuthByEmail(email);
    if (!result) {
      throw new NotFoundException({ message: 'User does not exist.' });
    }

    const resetToken = this.generateResetPasswordToken();
    const resetLink = `${this.resetPasswordRedirectUrl}?prt=${resetToken}`;

    const hashedToken = this.hashToken(resetToken);
    await this.authRepository.requestResetPassword(result.auth.id, hashedToken);

    return resetLink;
  }

  async updatePassword(dto: UpdatePasswordDto) {
    const { email, currentPassword, newPassword } = dto;

    const { auth } = await this.validateUser({
      email,
      password: currentPassword,
    });

    await this.checkIfPasswordIsSameAsCurrent(newPassword, auth.password);
    const hashedPassword = await this.passwordService.hash(newPassword);
    await this.authRepository.updatePassword(auth.id, hashedPassword);
  }

  async resetPassword(dto: ResetPasswordDto) {
    const { newPassword, resetToken } = dto;

    const hashedToken = this.hashToken(resetToken);
    const auth =
      await this.authRepository.findAuthByResetPasswordToken(hashedToken);
    if (!auth) {
      throw new NotFoundException({ message: 'Invalid reset request.' });
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
