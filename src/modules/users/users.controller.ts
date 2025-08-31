import { Controller } from '@nestjs/common';
import { ModuleRoutes } from '@/common/constants/routes';

@Controller(ModuleRoutes.Users.Main)
export class UsersController {}
