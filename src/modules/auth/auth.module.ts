import { Module } from '@nestjs/common';
import { AuthController } from '@/modules/auth/auth.controller';
import { AuthService } from '@/modules/auth/auth.service';
import { PasswordService } from '@/modules/auth/password.service';
import { UsersModule } from '@/modules/users/users.module';

@Module({
  controllers: [AuthController],
  providers: [AuthService, PasswordService],
  imports: [UsersModule],
})
export class AuthModule {}
