import { Module } from '@nestjs/common';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { BullModule } from '@nestjs/bullmq';
import { REDIS_URL_CONFIG_KEY } from '@/config/keys.config';
import AwsConfig from '@/config/aws.config';
import GcpConfig from '@/config/gcp.config';
import { AuthModule } from '@/modules/auth/auth.module';
import { UsersModule } from '@/modules/users/users.module';
import { OrganizationsModule } from '@/modules/organizations/organizations.module';
import { PermissionsModule } from '@/modules/permissions/permissions.module';
import { UploadModule } from '@/modules/upload/upload.module';
import { ExpensesModule } from '@/modules/expenses/expenses.module';
import { CategoriesModule } from '@/modules/categories/categories.module';
import { InvitesModule } from '@/modules/invites/invites.module';
import { ReportsModule } from '@/modules/reports/reports.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [AwsConfig, GcpConfig],
    }),
    ThrottlerModule.forRoot([
      {
        name: 'default',
        ttl: 60 * 1000,
        limit: 60,
      },
    ]),
    BullModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        connection: {
          url: configService.get<string>(REDIS_URL_CONFIG_KEY),
        },
        defaultJobOptions: {
          attempts: 3,
          backoff: {
            type: 'fixed',
            delay: 2000,
          },
        },
      }),
    }),
    AuthModule,
    UsersModule,
    OrganizationsModule,
    PermissionsModule,
    UploadModule,
    ExpensesModule,
    CategoriesModule,
    InvitesModule,
    ReportsModule,
  ],
  controllers: [],
  providers: [
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}
