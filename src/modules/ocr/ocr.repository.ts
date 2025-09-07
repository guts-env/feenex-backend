import { Injectable } from '@nestjs/common';
import { BaseRepository } from '@/common/modules/base/base.repository';
import { ProcessingStatus } from '@/database/types/db';

@Injectable()
export class OcrRepository extends BaseRepository {
  async create(orgId: string, userId: string) {
    return this.db
      .insertInto('ocr_results')
      .values({
        organization_id: orgId,
        user_id: userId,
        status: 'processing',
      })
      .returning('id')
      .executeTakeFirstOrThrow();
  }

  async update(
    id: string,
    dto: {
      ocrText?: string | null;
      errorMessage?: string | null;
      processingTimeMs?: number | null;
      status?: ProcessingStatus | null;
    },
  ) {
    const { ocrText, errorMessage, processingTimeMs, status } = dto;

    return this.db
      .updateTable('ocr_results')
      .set({
        ocr_text: ocrText,
        status: status || 'pending',
        error_message: errorMessage,
        processing_time_ms: processingTimeMs,
      })
      .where('id', '=', id)
      .execute();
  }
}
