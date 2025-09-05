import { Module } from '@nestjs/common';
import { ExpensesController } from '@/modules/expenses/expenses.controller';
import { ExpensesService } from '@/modules/expenses/expenses.service';
import { ExpensesRepository } from '@/modules/expenses/expenses.repository';
import { DatabaseModule } from '@/database/database.module';

@Module({
  controllers: [ExpensesController],
  providers: [ExpensesService, ExpensesRepository],
  imports: [DatabaseModule],
  exports: [ExpensesService],
})
export class ExpensesModule {}
