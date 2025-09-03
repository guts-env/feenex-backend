import { Module } from '@nestjs/common';
import { PermissionsService } from '@/modules/permissions/permissions.service';
import { PermissionsRepository } from '@/modules/permissions/permissions.repository';
import { DatabaseModule } from '@/database/database.module';

@Module({
  providers: [PermissionsService, PermissionsRepository],
  imports: [DatabaseModule],
  exports: [PermissionsService],
})
export class PermissionsModule {}
