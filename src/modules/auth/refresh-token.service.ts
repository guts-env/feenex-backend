import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createHash, randomBytes } from 'crypto';
import Redis from 'ioredis';
import { RedisService } from '@/database/redis.service';
import { REFRESH_TOKEN_EXPIRATION_TIME_CONFIG_KEY } from '@/config/keys.config';
import {
  REDIS_REFRESH_TOKEN_KEY,
  REDIS_USER_REFRESH_TOKENS_KEY,
} from '@/common/constants/redis';
import { type IStoredRefreshToken } from '@/modules/auth/types/refresh-token';

@Injectable()
export class RefreshTokenService {
  private readonly refreshTokenExpiration: number;
  private readonly redisClient: Redis;

  constructor(
    private readonly redisService: RedisService,
    private readonly configService: ConfigService,
  ) {
    this.redisClient = this.redisService.getClient();

    this.refreshTokenExpiration = Number(
      this.configService.get<string>(REFRESH_TOKEN_EXPIRATION_TIME_CONFIG_KEY),
    );
  }

  async generateRefreshToken(userId: string): Promise<string> {
    const tokenId = randomBytes(16).toString('hex');
    const token = randomBytes(32).toString('base64url');
    const hashedToken = this.hashToken(token);

    const payload: IStoredRefreshToken = {
      userId,
      tokenId,
      createdAt: Date.now(),
      hashedToken,
    };

    const redisKey = `${REDIS_REFRESH_TOKEN_KEY}:${userId}:${tokenId}`;
    const userTokensKey = `${REDIS_USER_REFRESH_TOKENS_KEY}:${userId}`;

    await this.redisClient.setex(
      redisKey,
      this.refreshTokenExpiration,
      JSON.stringify(payload),
    );

    await this.redisClient.sadd(userTokensKey, tokenId);
    await this.redisClient.expire(userTokensKey, this.refreshTokenExpiration);

    const finalToken = `${userId}.${tokenId}.${token}`;
    return finalToken;
  }

  async validateRefreshToken(
    refreshToken: string,
  ): Promise<IStoredRefreshToken> {
    const parts = refreshToken.split('.');

    if (parts.length !== 3) {
      throw new UnauthorizedException({
        message: 'Invalid refresh token format',
      });
    }

    const [userId, tokenId, token] = parts;

    if (!userId || !tokenId || !token) {
      throw new UnauthorizedException({
        message: 'Invalid refresh token format',
      });
    }

    const redisKey = `${REDIS_REFRESH_TOKEN_KEY}:${userId}:${tokenId}`;
    const storedData = await this.redisClient.get(redisKey);

    if (!storedData) {
      console.log('Refresh token expired or invalid', redisKey);
      throw new UnauthorizedException({
        message: 'Refresh token expired or invalid',
      });
    }

    const storedToken = JSON.parse(storedData) as IStoredRefreshToken;

    const hashedToken = this.hashToken(token);

    if (
      storedToken.hashedToken !== hashedToken ||
      storedToken.userId !== userId
    ) {
      throw new UnauthorizedException({
        message: 'Invalid refresh token',
      });
    }

    return storedToken;
  }

  async rotateRefreshToken(
    tokenData: IStoredRefreshToken,
    oldRefreshToken: string,
  ): Promise<string> {
    await this.revokeRefreshToken(oldRefreshToken);
    const newToken = await this.generateRefreshToken(tokenData.userId);
    return newToken;
  }

  async revokeRefreshToken(refreshToken: string): Promise<void> {
    try {
      const tokenData = await this.validateRefreshToken(refreshToken);
      const { userId, tokenId } = tokenData;

      const redisKey = `${REDIS_REFRESH_TOKEN_KEY}:${userId}:${tokenId}`;
      const userTokensKey = `${REDIS_USER_REFRESH_TOKENS_KEY}:${userId}`;

      await Promise.all([
        this.redisClient.del(redisKey),
        this.redisClient.srem(userTokensKey, tokenId),
      ]);
    } catch {
      return;
    }
  }

  async revokeAllUserTokens(userId: string): Promise<void> {
    const userTokensKey = `${REDIS_USER_REFRESH_TOKENS_KEY}:${userId}`;
    const tokenIds = await this.redisClient.smembers(userTokensKey);

    if (tokenIds.length > 0) {
      const tokenKeys = tokenIds.map(
        (tokenId) => `${REDIS_REFRESH_TOKEN_KEY}:${userId}:${tokenId}`,
      );

      await Promise.all([
        this.redisClient.del(...tokenKeys),
        this.redisClient.del(userTokensKey),
      ]);
    }
  }

  private hashToken(token: string): string {
    return createHash('sha256').update(token).digest('hex');
  }
}
