import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import ExpenseEventsGateway from '@/modules/sockets/expense-events.gateway';
import { ExpensesModule } from '@/modules/expenses/expenses.module';

@Module({
  providers: [ExpenseEventsGateway],
  exports: [ExpenseEventsGateway],
  imports: [JwtModule, ExpensesModule],
})
export class SocketsModule {}
