import { Module } from '@nestjs/common';
import { UsersService } from '@/modules/users/users.service';
import { UsersController } from '@/modules/users/users.controller';
import { UsersRepository } from '@/modules/users/users.repository';
import { DatabaseModule } from '@/database/database.module';

@Module({
  providers: [UsersService, UsersRepository],
  controllers: [UsersController],
  exports: [UsersService],
  imports: [DatabaseModule],
})
export class UsersModule {}
