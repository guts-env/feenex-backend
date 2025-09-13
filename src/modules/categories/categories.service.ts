import { Injectable } from '@nestjs/common';
import { plainToInstance } from 'class-transformer';
import { CategoriesRepository } from '@/modules/categories/categories.repository';
import BaseCategoryResDto from '@/modules/categories/dto/base-category-res.dto';

@Injectable()
export class CategoriesService {
  constructor(private readonly categoriesRepository: CategoriesRepository) {}

  async getCategories(): Promise<BaseCategoryResDto[]> {
    const categories = await this.categoriesRepository.findAll();

    return plainToInstance(BaseCategoryResDto, categories);
  }
}
