import { Controller, Get, Request, UseGuards } from '@nestjs/common';
import { ModuleRoutes } from '@/common/constants/routes';
import { UsersService } from '@/modules/users/users.service';
import { JwtAuthGuard } from '@/modules/auth/guards/jwt-auth.guard';
import { HasOrganizationGuard } from '@/modules/auth/guards/has-organization.guard';
import { RolesGuard } from '@/modules/auth/guards/roles.guard';
import { AllRoles } from '@/modules/auth/decorators/roles.decorator';
import { type IUser } from '@/modules/users/types/users';
import { type IAuthenticatedRequest } from '@/modules/auth/types/auth';

@AllRoles()
@UseGuards(JwtAuthGuard, HasOrganizationGuard, RolesGuard)
@Controller(ModuleRoutes.Users.Main)
export class UsersController {
  constructor(private readonly userService: UsersService) {}

  @Get(ModuleRoutes.Users.Paths.Profile)
  getProfile(@Request() req: IAuthenticatedRequest): Promise<IUser> {
    return this.userService.findById(req.user.sub);
  }
}
