import { Controller, Get, HttpCode, HttpStatus } from '@nestjs/common';
import { ModuleRoutes } from '@/common/constants/routes';
import { CategoriesService } from '@/modules/categories/categories.service';
import { RoleProtected } from '@/modules/auth/decorators/auth.decorator';
import { AllRoles } from '@/modules/auth/decorators/roles.decorator';
import BaseCategoryResDto from '@/modules/categories/dto/base-category-res.dto';

@RoleProtected()
@AllRoles()
@Controller(ModuleRoutes.Categories.Main)
export class CategoriesController {
  constructor(private readonly categoriesService: CategoriesService) {}

  @Get()
  @HttpCode(HttpStatus.OK)
  getCategories(): Promise<BaseCategoryResDto[]> {
    return this.categoriesService.getCategories();
  }
}
