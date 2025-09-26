import { Module } from '@nestjs/common';
import { EmailService } from '@/modules/email/email.service';
import { EmailController } from '@/modules/email/email.controller';

@Module({
  controllers: [EmailController],
  providers: [EmailService],
  exports: [EmailService],
})
export class EmailModule {}
