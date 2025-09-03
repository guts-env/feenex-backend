import { Module } from '@nestjs/common';
import { UserOrganizationService } from './user-organization.service';

@Module({
  providers: [UserOrganizationService],
})
export class UserOrganizationModule {}
