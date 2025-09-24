import { Module } from '@nestjs/common';
import { LlmService } from '@/modules/llm/llm.service';
import { LLmRepository } from '@/modules/llm/llm.repository';
import { DatabaseModule } from '@/database/database.module';
import { CategoriesModule } from '@/modules/categories/categories.module';

@Module({
  providers: [LlmService, LLmRepository],
  exports: [LlmService],
  imports: [DatabaseModule, CategoriesModule],
})
export class LlmModule {}
