import { Injectable } from '@nestjs/common';
import { BaseRepository } from '@/common/modules/base/base.repository';
import { type IExtractedData } from '@/modules/llm/types/llm';
import { type ProcessingStatus } from '@/database/types/db';

@Injectable()
export class LLmRepository extends BaseRepository {
  async create(ocrResultId: string) {
    return this.db
      .insertInto('llm_results')
      .values({
        ocr_result_id: ocrResultId,
        status: 'processing',
      })
      .returning('id')
      .executeTakeFirstOrThrow();
  }

  async update(
    id: string,
    dto: {
      extractedData?: IExtractedData | null;
      errorMessage?: string | null;
      processingTimeMs?: number | null;
      status?: ProcessingStatus | null;
    },
  ) {
    const { extractedData, errorMessage, processingTimeMs, status } = dto;

    return this.db
      .updateTable('llm_results')
      .set({
        extracted_data: extractedData ? JSON.stringify(extractedData) : null,
        status: status || 'pending',
        error_message: errorMessage,
        processing_time_ms: processingTimeMs,
      })
      .where('id', '=', id)
      .execute();
  }
}
