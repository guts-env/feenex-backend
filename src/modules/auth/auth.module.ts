import { Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { DatabaseModule } from '@/database/database.module';
import { AuthController } from '@/modules/auth/auth.controller';
import { AuthService } from '@/modules/auth/auth.service';
import { AuthRepository } from '@/modules/auth/auth.repository';
import { PasswordService } from '@/modules/auth/password.service';
import { LocalStrategy } from '@/modules/auth/passport/local.strategy';
import { JwtStrategy } from '@/modules/auth/passport/jwt.strategy';
import { UsersModule } from '@/modules/users/users.module';
import {
  JWT_EXPIRATION_TIME_CONFIG_KEY,
  JWT_SECRET_CONFIG_KEY,
} from '@/config/keys.config';

@Module({
  controllers: [AuthController],
  providers: [
    AuthService,
    AuthRepository,
    PasswordService,
    LocalStrategy,
    JwtStrategy,
  ],
  imports: [
    DatabaseModule,
    UsersModule,
    PassportModule,
    JwtModule.registerAsync({
      useFactory: (configService: ConfigService) => ({
        secret: configService.get<string>(JWT_SECRET_CONFIG_KEY),
        signOptions: {
          expiresIn: configService.get<string>(JWT_EXPIRATION_TIME_CONFIG_KEY),
        },
      }),
      inject: [ConfigService],
    }),
  ],
})
export class AuthModule {}
