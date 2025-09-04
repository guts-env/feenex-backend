import { Module } from '@nestjs/common';
import { DatabaseModule } from '@/database/database.module';
import { OrganizationsController } from '@/modules/organizations/organizations.controller';
import { OrganizationsService } from '@/modules/organizations/organizations.service';
import { OrganizationRepository } from '@/modules/organizations/organizations.repository';
import { InvitesModule } from '@/modules/invites/invites.module';

@Module({
  controllers: [OrganizationsController],
  providers: [OrganizationsService, OrganizationRepository],
  exports: [OrganizationsService],
  imports: [DatabaseModule, InvitesModule],
})
export class OrganizationsModule {}
