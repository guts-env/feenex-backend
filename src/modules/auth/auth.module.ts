import { Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt';
import { AuthController } from '@/modules/auth/auth.controller';
import { AuthService } from '@/modules/auth/auth.service';
import { PasswordService } from '@/modules/auth/password.service';
import { LocalStrategy } from '@/modules/auth/passport/local.strategy';
import { UsersModule } from '@/modules/users/users.module';
import { ConfigService } from '@nestjs/config';

@Module({
  controllers: [AuthController],
  providers: [AuthService, PasswordService, LocalStrategy],
  imports: [
    UsersModule,
    PassportModule,
    JwtModule.registerAsync({
      useFactory: (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET'),
        signOptions: { expiresIn: '60s' },
      }),
      inject: [ConfigService],
    }),
  ],
})
export class AuthModule {}
