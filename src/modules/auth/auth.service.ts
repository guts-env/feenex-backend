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
import { UserLoginResDto } from '@/modules/auth/dto/user-login-res.dto';
import { AccountTypeEnum } from '@/common/constants/enums';
import {
  type IUserPassport,
  type IValidateUserInput,
} from '@/modules/auth/types/auth';
import { type IUser } from '@/modules/users/types/users';

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
      accountType: AccountTypeEnum.BUSINESS,
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

  authenticate(user: IUserPassport): UserLoginResDto {
    return plainToInstance(UserLoginResDto, {
      accessToken: this.jwtService.sign(user),
      user,
    });
  }
}
