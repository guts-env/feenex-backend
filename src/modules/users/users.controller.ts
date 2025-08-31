import { Controller, Get, Request, UseGuards } from '@nestjs/common';
import { ModuleRoutes } from '@/common/constants/routes';
import { UsersService } from '@/modules/users/users.service';
import { JwtAuthGuard } from '@/modules/auth/guards/jwt-auth.guard';
import { type ValidatedJwtPayload } from '@/modules/auth/types/auth';

@Controller(ModuleRoutes.Users.Main)
export class UsersController {
  constructor(private readonly userService: UsersService) {}

  @UseGuards(JwtAuthGuard)
  @Get(ModuleRoutes.Users.Profile)
  getProfile(@Request() req: ValidatedJwtPayload) {
    return this.userService.findById(req.user.sub);
  }
}
