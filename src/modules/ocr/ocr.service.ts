import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ImageAnnotatorClient } from '@google-cloud/vision';
import { OcrRepository } from '@/modules/ocr/ocr.repository';
import { GCP_CONFIG_KEY } from '@/config/keys.config';
import { type IGcpConfig } from '@/common/types/config';

@Injectable()
export class OcrService {
  private readonly client: ImageAnnotatorClient;
  private readonly logger = new Logger(OcrService.name);

  constructor(
    private readonly configService: ConfigService,
    private readonly ocrRepository: OcrRepository,
  ) {
    const gcpConfig = this.configService.get<IGcpConfig>(GCP_CONFIG_KEY)!;

    this.client = new ImageAnnotatorClient({
      credentials: gcpConfig.credentials,
    });
  }

  async extractText(imageUrls: string[]) {
    const ocrRecord = await this.ocrRepository.create();

    try {
      const startTime = Date.now();

      const results = await Promise.all(
        imageUrls.map(
          async (imageUrl) =>
            await this.client.annotateImage({
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
            }),
        ),
      ).then((results) => results.map((result) => result[0]));

      if (results.some((result) => result.error)) {
        await this.ocrRepository.update(ocrRecord.id, {
          status: 'failed',
          errorMessage: results.find((result) => result.error)?.error?.message,
        });

        this.logger.error(
          results.find((result) => result.error)?.error?.message,
        );

        throw new InternalServerErrorException(
          'Something went wrong while extracting receipt data',
        );
      }

      const endTime = Date.now();
      const processingTimeMs = endTime - startTime;

      if (!results.some((result) => result.fullTextAnnotation?.text)) {
        throw new BadRequestException('No text found in the image');
      }

      await this.ocrRepository.update(ocrRecord.id, {
        ocrText: results
          .map((result) => result.fullTextAnnotation?.text)
          .join('\n\nRECEIPT SEPARATOR\n\n'),
        processingTimeMs,
        status: 'completed',
      });

      return {
        ocrResultId: ocrRecord.id,
        ocrText: results
          .map((result) => result.fullTextAnnotation?.text)
          .join('\n\nRECEIPT SEPARATOR\n\n'),
      };
    } catch (error) {
      await this.ocrRepository.update(ocrRecord.id, {
        status: 'failed',
        errorMessage: error instanceof Error ? error.message : 'Unknown error',
      });

      this.logger.error(error);
      throw new InternalServerErrorException(
        'Something went wrong while extracting receipt data',
      );
    }
  }
}
