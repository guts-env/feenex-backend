import { Controller } from '@nestjs/common';
import { ModuleRoutes } from '@/common/constants/routes';

@Controller(ModuleRoutes.Organizations.Main)
export class OrganizationsController {}
