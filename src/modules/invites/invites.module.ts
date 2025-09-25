import { forwardRef, Module } from '@nestjs/common';
import { InvitesService } from '@/modules/invites/invites.service';
import { InvitesController } from '@/modules/invites/invites.controller';
import { InvitesRepository } from '@/modules/invites/invites.repository';
import { DatabaseModule } from '@/database/database.module';
import { UploadModule } from '@/modules/upload/upload.module';
import { UsersModule } from '@/modules/users/users.module';
import { EmailModule } from '@/modules/email/email.module';
import { AccountPlansModule } from '@/modules/account-plans/account-plans.module';
import { OrganizationsModule } from '@/modules/organizations/organizations.module';

@Module({
  providers: [InvitesService, InvitesRepository],
  controllers: [InvitesController],
  imports: [
    DatabaseModule,
    UsersModule,
    UploadModule,
    EmailModule,
    AccountPlansModule,
    forwardRef(() => OrganizationsModule),
  ],
  exports: [InvitesService],
})
export class InvitesModule {}
