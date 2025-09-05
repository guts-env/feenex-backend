import { Injectable } from '@nestjs/common';
import { OcrRepository } from '@/modules/ocr/ocr.repository';

@Injectable()
export class OcrService {
  constructor(private readonly ocrRepository: OcrRepository) {}
}
