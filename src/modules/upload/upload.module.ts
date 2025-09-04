import { Module } from '@nestjs/common';
import { UploadService } from '@/modules/upload/upload.service';
import { UploadController } from '@/modules/upload/upload.controller';
import { TestEmailService } from '@/modules/upload/test-email.service';

@Module({
  controllers: [UploadController],
  providers: [UploadService, TestEmailService],
})
export class UploadModule {}
