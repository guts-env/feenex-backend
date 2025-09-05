import { Module } from '@nestjs/common';
import { ReportsController } from '@/modules/reports/reports.controller';
import { ReportsService } from '@/modules/reports/reports.service';
import { ReportsRepository } from '@/modules/reports/reports.repository';
import { DatabaseModule } from '@/database/database.module';
import { ExpensesModule } from '@/modules/expenses/expenses.module';

@Module({
  controllers: [ReportsController],
  providers: [ReportsService, ReportsRepository],
  imports: [DatabaseModule, ExpensesModule],
})
export class ReportsModule {}
