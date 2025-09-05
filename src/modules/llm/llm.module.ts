import { Module } from '@nestjs/common';
import { LlmService } from '@/modules/llm/llm.service';
import { LLmRepository } from '@/modules/llm/llm.repository';
import { DatabaseModule } from '@/database/database.module';

@Module({
  providers: [LlmService, LLmRepository],
  exports: [LlmService],
  imports: [DatabaseModule],
})
export class LlmModule {}
