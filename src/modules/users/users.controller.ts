import { Controller, Get, Request, UseGuards } from '@nestjs/common';
import { ModuleRoutes } from '@/common/constants/routes';
import { UsersService } from '@/modules/users/users.service';
import { JwtAuthGuard } from '@/modules/auth/guards/jwt-auth.guard';
import { HasOrganizationGuard } from '@/modules/auth/guards/has-organization.guard';
import { RolesGuard } from '@/modules/auth/guards/roles.guard';
import { AllUsers } from '@/modules/auth/decorators/roles.decorator';
import { type IAuthenticatedRequest } from '@/modules/auth/types/auth';

@AllUsers()
@UseGuards(JwtAuthGuard, HasOrganizationGuard, RolesGuard)
@Controller(ModuleRoutes.Users.Main)
export class UsersController {
  constructor(private readonly userService: UsersService) {}

  @Get(ModuleRoutes.Users.Profile)
  getProfile(@Request() req: IAuthenticatedRequest) {
    return this.userService.findById(req.user.sub);
  }
}
