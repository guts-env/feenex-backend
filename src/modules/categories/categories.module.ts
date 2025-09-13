import { Module } from '@nestjs/common';
import { DatabaseModule } from '@/database/database.module';
import { CategoriesController } from '@/modules/categories/categories.controller';
import { CategoriesService } from '@/modules/categories/categories.service';
import { CategoriesRepository } from '@/modules/categories/categories.repository';

@Module({
  controllers: [CategoriesController],
  providers: [CategoriesService, CategoriesRepository],
  imports: [DatabaseModule],
})
export class CategoriesModule {}
