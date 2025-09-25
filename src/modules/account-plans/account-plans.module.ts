import { Module } from '@nestjs/common';
import { AccountPlansController } from '@/modules/account-plans/account-plans.controller';
import { AccountPlansService } from '@/modules/account-plans/account-plans.service';
import { AccountPlansRepository } from '@/modules/account-plans/account-plans.repository';
import { DatabaseModule } from '@/database/database.module';
import { RedisModule } from '@/database/redis.module';

@Module({
  controllers: [AccountPlansController],
  providers: [AccountPlansService, AccountPlansRepository],
  exports: [AccountPlansService],
  imports: [DatabaseModule, RedisModule],
})
export class AccountPlansModule {}
