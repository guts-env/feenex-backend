import { BadRequestException, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ImageAnnotatorClient } from '@google-cloud/vision';
import { OcrRepository } from '@/modules/ocr/ocr.repository';
import { GCP_CONFIG_KEY } from '@/config/keys.config';
import { type IGcpConfig } from '@/common/types/config';

@Injectable()
export class OcrService {
  private readonly client: ImageAnnotatorClient;

  constructor(
    private readonly configService: ConfigService,
    private readonly ocrRepository: OcrRepository,
  ) {
    const gcpConfig = this.configService.get<IGcpConfig>(GCP_CONFIG_KEY)!;

    this.client = new ImageAnnotatorClient({
      credentials: gcpConfig.credentials,
    });
  }

  async extractText(imageUrl: string) {
    const [result] = await this.client.annotateImage({
      features: [{ type: 'DOCUMENT_TEXT_DETECTION' }],
      image: {
        source: { imageUri: imageUrl },
      },
      imageContext: {
        languageHints: ['en', 'fil', 'tl', 'vnd', 'zh'],
        textDetectionParams: {
          enableTextDetectionConfidenceScore: true,
        },
      },
    });

    if (!result.fullTextAnnotation?.text) {
      throw new BadRequestException('No text found in the image');
    }

    /* TODO: save to database */

    return result.fullTextAnnotation?.text;
  }
}
