import { forwardRef, Module } from '@nestjs/common';
import { SubscriptionsService } from '@/modules/subscriptions/subscriptions.service';
import { SubscriptionsController } from '@/modules/subscriptions/subscriptions.controller';
import { SubscriptionsRepository } from '@/modules/subscriptions/subscriptions.repository';
import { DatabaseModule } from '@/database/database.module';
import { AccountPlansModule } from '@/modules/account-plans/account-plans.module';
import { OrganizationsModule } from '@/modules/organizations/organizations.module';

@Module({
  controllers: [SubscriptionsController],
  providers: [SubscriptionsService, SubscriptionsRepository],
  exports: [SubscriptionsService],
  imports: [
    DatabaseModule,
    forwardRef(() => OrganizationsModule),
    forwardRef(() => AccountPlansModule),
  ],
})
export class SubscriptionsModule {}
