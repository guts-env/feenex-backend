import { Module } from '@nestjs/common';
import { OcrService } from '@/modules/ocr/ocr.service';
import { OcrRepository } from '@/modules/ocr/ocr.repository';
import { DatabaseModule } from '@/database/database.module';

@Module({
  providers: [OcrService, OcrRepository],
  exports: [OcrService],
  imports: [DatabaseModule],
})
export class OcrModule {}
