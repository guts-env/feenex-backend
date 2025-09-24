import { Module } from '@nestjs/common';
import { SubscriptionsService } from '@/modules/subscriptions/subscriptions.service';
import { SubscriptionsController } from '@/modules/subscriptions/subscriptions.controller';
import { SubscriptionsRepository } from '@/modules/subscriptions/subscriptions.repository';
import { DatabaseModule } from '@/database/database.module';

@Module({
  controllers: [SubscriptionsController],
  providers: [SubscriptionsService, SubscriptionsRepository],
  exports: [SubscriptionsService],
  imports: [DatabaseModule],
})
export class SubscriptionsModule {}
