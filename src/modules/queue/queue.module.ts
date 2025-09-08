import { forwardRef, Module } from '@nestjs/common';
import { QueueService } from './queue.service';
import { BullModule } from '@nestjs/bullmq';
import { EXPENSES_QUEUE } from '@/common/constants/queue';
import { ExpensesModule } from '@/modules/expenses/expenses.module';
import { UploadModule } from '@/modules/upload/upload.module';
import { OcrModule } from '@/modules/ocr/ocr.module';
import { LlmModule } from '@/modules/llm/llm.module';
import { ExpensesConsumer } from '@/modules/queue/processors/expenses.processor';

@Module({
  providers: [QueueService, ExpensesConsumer],
  imports: [
    BullModule.registerQueue({ name: EXPENSES_QUEUE }),
    forwardRef(() => ExpensesModule),
    UploadModule,
    OcrModule,
    LlmModule,
  ],
  exports: [QueueService],
})
export class QueueModule {}
