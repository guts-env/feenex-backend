import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';
import { REDIS_URL_CONFIG_KEY } from '@/config/keys.config';

@Injectable()
export class RedisService {
  private client: Redis;

  constructor(private readonly configService: ConfigService) {
    this.client = new Redis(
      this.configService.get<string>(REDIS_URL_CONFIG_KEY)!,
    );
  }

  getClient(): Redis {
    return this.client;
  }
}
