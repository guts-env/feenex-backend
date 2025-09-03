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
        secret: configService.get<string>('JWT_SECRET'),
        signOptions: {
          expiresIn: configService.get<string>('JWT_EXPIRATION_TIME'),
        },
      }),
      inject: [ConfigService],
    }),
  ],
})
export class AuthModule {}
