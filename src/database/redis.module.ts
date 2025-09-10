import { Module } from '@nestjs/common';
import { RedisService } from '@/database/redis.service';

@Module({
  providers: [RedisService],
  exports: [RedisService],
})
export class RedisModule {}
