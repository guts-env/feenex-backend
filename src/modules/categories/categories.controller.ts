import { Controller } from '@nestjs/common';
import { ModuleRoutes } from '@/common/constants/routes';

@Controller(ModuleRoutes.Categories.Main)
export class CategoriesController {}
