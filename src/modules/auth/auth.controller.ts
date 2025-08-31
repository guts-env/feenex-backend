import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { ModuleRoutes } from '@/common/constants/routes';
import { AuthService } from '@/modules/auth/auth.service';
import UserRegisterDto from '@/modules/auth/dto/user-register.dto';
import UserLoginDto from '@/modules/auth/dto/user-login.dto';

@Controller(ModuleRoutes.Auth.Main)
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post(ModuleRoutes.Auth.Register)
  @HttpCode(HttpStatus.CREATED)
  async register(@Body() userRegisterDto: UserRegisterDto) {
    await this.authService.register(userRegisterDto);
  }

  @Post(ModuleRoutes.Auth.Login)
  @HttpCode(HttpStatus.OK)
  async login(@Body() userLoginDto: UserLoginDto) {
    await this.authService.authenticate(userLoginDto);
  }
}
