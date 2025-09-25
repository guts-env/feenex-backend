import { forwardRef, Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ExpensesController } from '@/modules/expenses/expenses.controller';
import { ExpensesRepository } from '@/modules/expenses/expenses.repository';
import { ExpensesService } from '@/modules/expenses/expenses.service';
import { QueueModule } from '@/modules/queue/queue.module';
import { DatabaseModule } from '@/database/database.module';
import { UploadModule } from '@/modules/upload/upload.module';
import { OcrModule } from '@/modules/ocr/ocr.module';
import { LlmModule } from '@/modules/llm/llm.module';
import { RedisModule } from '@/database/redis.module';
import { AccountPlansModule } from '@/modules/account-plans/account-plans.module';
import { OrganizationsModule } from '@/modules/organizations/organizations.module';
import ExpenseEventsGateway from '@/modules/sockets/expense-events.gateway';

@Module({
  controllers: [ExpensesController],
  providers: [ExpensesService, ExpensesRepository, ExpenseEventsGateway],
  imports: [
    forwardRef(() => QueueModule),
    forwardRef(() => AccountPlansModule),
    JwtModule,
    DatabaseModule,
    UploadModule,
    OcrModule,
    LlmModule,
    RedisModule,
    forwardRef(() => OrganizationsModule),
  ],
  exports: [ExpensesService, ExpenseEventsGateway],
})
export class ExpensesModule {}
