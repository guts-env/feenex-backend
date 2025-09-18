import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Patch,
  Post,
  Request,
  Res,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { type Response } from 'express';
import { ThrottleLimits, ThrottleNames } from '@/config/throttle.config';
import { ModuleRoutes } from '@/common/constants/routes';
import { LocalAuthGuard } from '@/modules/auth/guards/local-auth.guard';
import { AuthService } from '@/modules/auth/auth.service';
import { EmailService } from '@/modules/email/email.service';
import UserRegisterDto from '@/modules/auth/dto/user-register.dto';
import AcceptInviteDto from '@/modules/auth/dto/accept-invite.dto';
import RequestResetPasswordDto from '@/modules/auth/dto/request-reset-password.dto';
import ResetPasswordDto from '@/modules/auth/dto/reset-password.dto';
import UpdatePasswordDto from '@/modules/auth/dto/update-password.dto';
import { Authenticated } from '@/modules/auth/decorators/auth.decorator';
import { type IAuthenticatedRequest } from '@/modules/auth/types/auth';

@Controller(ModuleRoutes.Auth.Main)
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly emailService: EmailService,
  ) {}

  @Post(ModuleRoutes.Auth.Paths.Register)
  @Throttle(ThrottleLimits[ThrottleNames.AUTH_REGISTER])
  @HttpCode(HttpStatus.CREATED)
  async register(@Body() userRegisterDto: UserRegisterDto) {
    await this.authService.register(userRegisterDto);
    void this.emailService.sendWelcomeEmail(userRegisterDto.email);
  }

  @Post(ModuleRoutes.Auth.Paths.AcceptInvite)
  @Throttle(ThrottleLimits[ThrottleNames.INVITE_ACCEPT])
  @HttpCode(HttpStatus.CREATED)
  async registerInvitedUser(@Body() inviteMemberDto: AcceptInviteDto) {
    await this.authService.registerInvitedUser(inviteMemberDto);
  }

  @Post(ModuleRoutes.Auth.Paths.RequestResetPassword)
  @Throttle(ThrottleLimits[ThrottleNames.REQUEST_RESET_PASSWORD])
  @HttpCode(HttpStatus.OK)
  async requestResetPassword(
    @Body() resetPasswordDto: RequestResetPasswordDto,
  ) {
    const resetLink =
      await this.authService.requestResetPassword(resetPasswordDto);
    void this.emailService.sendResetPasswordEmail(
      resetPasswordDto.email,
      resetLink,
    );
  }

  @Patch(ModuleRoutes.Auth.Paths.ResetPassword)
  @Throttle(ThrottleLimits[ThrottleNames.RESET_PASSWORD])
  @HttpCode(HttpStatus.OK)
  resetPassword(@Body() resetPasswordDto: ResetPasswordDto) {
    return this.authService.resetPassword(resetPasswordDto);
  }

  @Authenticated()
  @Patch(ModuleRoutes.Auth.Paths.UpdatePassword)
  @Throttle(ThrottleLimits[ThrottleNames.UPDATE_PASSWORD])
  @HttpCode(HttpStatus.OK)
  updatePassword(@Body() updatePasswordDto: UpdatePasswordDto) {
    return this.authService.updatePassword(updatePasswordDto);
  }

  @UseGuards(LocalAuthGuard)
  @Post(ModuleRoutes.Auth.Paths.Login)
  @Throttle(ThrottleLimits[ThrottleNames.AUTH_STRICT])
  @HttpCode(HttpStatus.OK)
  async login(
    @Request() req: IAuthenticatedRequest,
    @Res() res: Response,
  ): Promise<void> {
    const result = await this.authService.authenticate(req.user);
    this.setRefreshTokenCookie(res, result.refreshToken);

    res.json({
      accessToken: result.accessToken,
      user: result.user,
    });
  }

  @Get(ModuleRoutes.Auth.Paths.Refresh)
  @Throttle(ThrottleLimits[ThrottleNames.DEFAULT])
  @HttpCode(HttpStatus.OK)
  async refresh(
    @Request() req: IAuthenticatedRequest,
    @Res() res: Response,
  ): Promise<void> {
    const refreshToken = (req.cookies as { refreshToken?: string })
      ?.refreshToken;

    if (!refreshToken) {
      throw new UnauthorizedException({ message: 'Refresh token not found' });
    }

    const result = await this.authService.refreshAccessToken(refreshToken);
    this.setRefreshTokenCookie(res, result.refreshToken);

    res.json({
      accessToken: result.accessToken,
    });
  }

  @Authenticated()
  @Post(ModuleRoutes.Auth.Paths.Logout)
  @Throttle(ThrottleLimits[ThrottleNames.DEFAULT])
  @HttpCode(HttpStatus.OK)
  async logout(
    @Request() req: IAuthenticatedRequest,
    @Res() res: Response,
  ): Promise<void> {
    const refreshToken = (req.cookies as { refreshToken?: string })
      ?.refreshToken;

    if (refreshToken) {
      await this.authService.logout(refreshToken);
    }

    this.clearRefreshTokenCookie(res);

    res.json({
      message: 'OK',
    });
  }

  @Authenticated()
  @Post(ModuleRoutes.Auth.Paths.LogoutAllDevices)
  @Throttle(ThrottleLimits[ThrottleNames.DEFAULT])
  @HttpCode(HttpStatus.OK)
  logoutAllDevices(
    @Request() req: IAuthenticatedRequest,
    @Res() res: Response,
  ): Promise<void> {
    this.clearRefreshTokenCookie(res);
    return this.authService.logoutAllDevices(req.user.sub);
  }

  private setRefreshTokenCookie(res: Response, refreshToken: string): void {
    const cookieExpiration = 7 * 24 * 60 * 60 * 1000;

    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: true,
      sameSite: 'none',
      maxAge: cookieExpiration,
    });
  }

  private clearRefreshTokenCookie(res: Response): void {
    res.clearCookie('refreshToken', {
      httpOnly: true,
      secure: true,
      sameSite: 'none',
    });
  }
}
