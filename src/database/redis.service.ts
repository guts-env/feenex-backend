import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';
import {
  REDIS_HOST_CONFIG_KEY,
  REDIS_PORT_CONFIG_KEY,
  REDIS_PASSWORD_CONFIG_KEY,
} from '@/config/keys.config';

@Injectable()
export class RedisService {
  private client: Redis;

  constructor(private readonly configService: ConfigService) {
    this.client = new Redis({
      host: this.configService.get<string>(REDIS_HOST_CONFIG_KEY),
      port: Number(this.configService.get<string>(REDIS_PORT_CONFIG_KEY)),
      password: this.configService.get<string>(REDIS_PASSWORD_CONFIG_KEY),
      db: 1, // BullMQ uses db 0
    });
  }

  getClient(): Redis {
    return this.client;
  }
}
