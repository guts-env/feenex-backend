import { Module } from '@nestjs/common';
import { InvitesService } from '@/modules/invites/invites.service';
import { InvitesController } from '@/modules/invites/invites.controller';
import { InvitesRepository } from '@/modules/invites/invites.repository';
import { DatabaseModule } from '@/database/database.module';
import { UsersModule } from '@/modules/users/users.module';

@Module({
  providers: [InvitesService, InvitesRepository],
  controllers: [InvitesController],
  imports: [DatabaseModule, UsersModule],
  exports: [InvitesService],
})
export class InvitesModule {}
