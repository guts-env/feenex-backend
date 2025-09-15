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
import { type Response } from 'express';
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
  @HttpCode(HttpStatus.CREATED)
  async register(@Body() userRegisterDto: UserRegisterDto) {
    await this.authService.register(userRegisterDto);
    void this.emailService.sendWelcomeEmail(userRegisterDto.email);
  }

  @Post(ModuleRoutes.Auth.Paths.AcceptInvite)
  @HttpCode(HttpStatus.CREATED)
  async registerInvitedUser(@Body() inviteMemberDto: AcceptInviteDto) {
    await this.authService.registerInvitedUser(inviteMemberDto);
  }

  @Post(ModuleRoutes.Auth.Paths.RequestResetPassword)
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
  @HttpCode(HttpStatus.OK)
  resetPassword(@Body() resetPasswordDto: ResetPasswordDto) {
    return this.authService.resetPassword(resetPasswordDto);
  }

  @Authenticated()
  @Patch(ModuleRoutes.Auth.Paths.UpdatePassword)
  @HttpCode(HttpStatus.OK)
  updatePassword(@Body() updatePasswordDto: UpdatePasswordDto) {
    return this.authService.updatePassword(updatePasswordDto);
  }

  @UseGuards(LocalAuthGuard)
  @Post(ModuleRoutes.Auth.Paths.Login)
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
  @HttpCode(HttpStatus.OK)
  logoutAllDevices(
    @Request() req: IAuthenticatedRequest,
    @Res() res: Response,
  ): Promise<void> {
    this.clearRefreshTokenCookie(res);
    return this.authService.logoutAllDevices(req.user.sub);
  }

  private setRefreshTokenCookie(res: Response, refreshToken: string): void {
    const isProduction = process.env.NODE_ENV === 'production';
    const cookieExpiration = 7 * 24 * 60 * 60 * 1000;

    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: isProduction,
      sameSite: 'none',
      maxAge: cookieExpiration,
      path: '/',
    });
  }

  private clearRefreshTokenCookie(res: Response): void {
    res.clearCookie('refreshToken', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      path: '/',
    });
  }
}
