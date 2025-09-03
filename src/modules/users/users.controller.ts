import { Controller, Get, Request, UseGuards } from '@nestjs/common';
import { ModuleRoutes } from '@/common/constants/routes';
import { UsersService } from '@/modules/users/users.service';
import { JwtAuthGuard } from '@/modules/auth/guards/jwt-auth.guard';
import { HasOrganizationGuard } from '@/modules/auth/guards/has-organization.guard';
import { RolesGuard } from '@/modules/auth/guards/roles.guard';
import { Roles } from '@/modules/auth/decorators/roles.decorator';
import { UserRoleEnum } from '@/common/constants/enums';
import { type IAuthenticatedRequest } from '@/modules/auth/types/auth';

@Roles(
  UserRoleEnum.PERSONAL_ADMIN,
  UserRoleEnum.BUSINESS_ADMIN,
  UserRoleEnum.MEMBER,
)
@UseGuards(JwtAuthGuard, HasOrganizationGuard, RolesGuard)
@Controller(ModuleRoutes.Users.Main)
export class UsersController {
  constructor(private readonly userService: UsersService) {}

  @Get(ModuleRoutes.Users.Profile)
  getProfile(@Request() req: IAuthenticatedRequest) {
    return this.userService.findById(req.user.sub);
  }
}
