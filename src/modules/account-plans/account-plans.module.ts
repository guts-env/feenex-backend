import { forwardRef, Module } from '@nestjs/common';
import { AccountPlansController } from '@/modules/account-plans/account-plans.controller';
import { AccountPlansService } from '@/modules/account-plans/account-plans.service';
import { AccountPlansRepository } from '@/modules/account-plans/account-plans.repository';
import { OrganizationsModule } from '@/modules/organizations/organizations.module';
import { ExpensesModule } from '@/modules/expenses/expenses.module';
import { SubscriptionsModule } from '@/modules/subscriptions/subscriptions.module';
import { DatabaseModule } from '@/database/database.module';
import { RedisModule } from '@/database/redis.module';

@Module({
  controllers: [AccountPlansController],
  providers: [AccountPlansService, AccountPlansRepository],
  exports: [AccountPlansService],
  imports: [
    DatabaseModule,
    RedisModule,
    forwardRef(() => OrganizationsModule),
    forwardRef(() => ExpensesModule),
    forwardRef(() => SubscriptionsModule),
  ],
})
export class AccountPlansModule {}
