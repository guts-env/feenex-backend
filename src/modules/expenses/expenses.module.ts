import { Module } from '@nestjs/common';
import { ExpensesController } from '@/modules/expenses/expenses.controller';
import { ExpensesRepository } from '@/modules/expenses/expenses.repository';
import { ExpensesService } from '@/modules/expenses/expenses.service';
import { DatabaseModule } from '@/database/database.module';
import { UploadModule } from '@/modules/upload/upload.module';
import { OcrModule } from '@/modules/ocr/ocr.module';
import { LlmModule } from '@/modules/llm/llm.module';

@Module({
  controllers: [ExpensesController],
  providers: [ExpensesService, ExpensesRepository],
  imports: [DatabaseModule, UploadModule, OcrModule, LlmModule],
  exports: [ExpensesService],
})
export class ExpensesModule {}
