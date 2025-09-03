import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AuthModule } from '@/modules/auth/auth.module';
import { UsersModule } from '@/modules/users/users.module';
import { OrganizationsModule } from '@/modules/organizations/organizations.module';
import { PermissionsModule } from './modules/permissions/permissions.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    AuthModule,
    UsersModule,
    OrganizationsModule,
    PermissionsModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
