import { Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { DatabaseModule } from '@/database/database.module';
import { AuthController } from '@/modules/auth/auth.controller';
import { AuthService } from '@/modules/auth/auth.service';
import { AuthRepository } from '@/modules/auth/auth.repository';
import { PasswordService } from '@/modules/auth/password.service';
import { RefreshTokenService } from '@/modules/auth/refresh-token.service';
import { LocalStrategy } from '@/modules/auth/passport/local.strategy';
import { JwtStrategy } from '@/modules/auth/passport/jwt.strategy';
import { UsersModule } from '@/modules/users/users.module';
import { OrganizationsModule } from '@/modules/organizations/organizations.module';
import { InvitesModule } from '@/modules/invites/invites.module';
import { UploadModule } from '@/modules/upload/upload.module';
import { EmailModule } from '@/modules/email/email.module';
import { AccountPlansModule } from '@/modules/account-plans/account-plans.module';
import {
  JWT_EXPIRATION_TIME_CONFIG_KEY,
  JWT_SECRET_CONFIG_KEY,
} from '@/config/keys.config';
import { RedisModule } from '@/database/redis.module';

@Module({
  controllers: [AuthController],
  providers: [
    AuthService,
    AuthRepository,
    PasswordService,
    RefreshTokenService,
    JwtStrategy,
    LocalStrategy,
  ],
  imports: [
    DatabaseModule,
    RedisModule,
    EmailModule,
    InvitesModule,
    OrganizationsModule,
    AccountPlansModule,
    UploadModule,
    UsersModule,
    PassportModule,
    JwtModule.registerAsync({
      useFactory: (configService: ConfigService) => ({
        secret: configService.get<string>(JWT_SECRET_CONFIG_KEY),
        signOptions: {
          expiresIn: Number(
            configService.get<number>(JWT_EXPIRATION_TIME_CONFIG_KEY),
          ),
        },
      }),
      inject: [ConfigService],
    }),
  ],
})
export class AuthModule {}
