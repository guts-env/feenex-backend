import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Post,
  Request,
  UseGuards,
} from '@nestjs/common';
import { ModuleRoutes } from '@/common/constants/routes';
import { LocalAuthGuard } from '@/modules/auth/guards/local-auth.guard';
import { AuthService } from '@/modules/auth/auth.service';
import { EmailService } from '@/modules/email/email.service';
import UserRegisterDto from '@/modules/auth/dto/user-register.dto';
import AcceptInviteDto from '@/modules/auth/dto/accept-invite.dto';
import UserLoginResDto from '@/modules/auth/dto/user-login-res.dto';
import RequestResetPasswordDto from '@/modules/auth/dto/request-reset-password.dto';
import ResetPasswordDto from '@/modules/auth/dto/reset-password.dto';
import UpdatePasswordDto from '@/modules/auth/dto/update-password.dto';
import { type IAuthenticatedRequest } from '@/modules/auth/types/auth';

@Controller(ModuleRoutes.Auth.Main)
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly emailService: EmailService,
  ) {}

  @Post(ModuleRoutes.Auth.Paths.Register)
  @HttpCode(HttpStatus.CREATED)
  async register(@Body() userRegisterDto: UserRegisterDto) {
    await this.authService.register(userRegisterDto);
    return this.emailService.sendWelcomeEmail(userRegisterDto.email);
  }

  @Post(ModuleRoutes.Auth.Paths.AcceptInvite)
  @HttpCode(HttpStatus.CREATED)
  async registerInvitedUser(@Body() inviteMemberDto: AcceptInviteDto) {
    await this.authService.registerInvitedUser(inviteMemberDto);
    return this.emailService.sendWelcomeEmail(inviteMemberDto.email);
  }

  @Post(ModuleRoutes.Auth.Paths.RequestResetPassword)
  @HttpCode(HttpStatus.OK)
  async requestResetPassword(
    @Body() resetPasswordDto: RequestResetPasswordDto,
  ) {
    const resetLink =
      await this.authService.requestResetPassword(resetPasswordDto);
    return this.emailService.sendResetPasswordEmail(
      resetPasswordDto.email,
      resetLink,
    );
  }

  @Post(ModuleRoutes.Auth.Paths.ResetPassword)
  @HttpCode(HttpStatus.OK)
  async resetPassword(@Body() resetPasswordDto: ResetPasswordDto) {
    await this.authService.resetPassword(resetPasswordDto);
  }

  @Post(ModuleRoutes.Auth.Paths.UpdatePassword)
  @HttpCode(HttpStatus.OK)
  async updatePassword(@Body() updatePasswordDto: UpdatePasswordDto) {
    await this.authService.updatePassword(updatePasswordDto);
  }

  @UseGuards(LocalAuthGuard)
  @Post(ModuleRoutes.Auth.Paths.Login)
  @HttpCode(HttpStatus.OK)
  login(@Request() req: IAuthenticatedRequest): UserLoginResDto {
    return this.authService.authenticate(req.user);
  }
}
