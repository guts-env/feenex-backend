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
import UserRegisterDto from '@/modules/auth/dto/user-register.dto';
import {
  type IAuthResponse,
  type IAuthenticatedRequest,
} from '@/modules/auth/types/auth';

@Controller(ModuleRoutes.Auth.Main)
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post(ModuleRoutes.Auth.Register)
  @HttpCode(HttpStatus.CREATED)
  async register(@Body() userRegisterDto: UserRegisterDto) {
    await this.authService.register(userRegisterDto);
  }

  @UseGuards(LocalAuthGuard)
  @Post(ModuleRoutes.Auth.Login)
  @HttpCode(HttpStatus.OK)
  login(@Request() req: IAuthenticatedRequest): IAuthResponse {
    return this.authService.authenticate(req.user);
  }
}
