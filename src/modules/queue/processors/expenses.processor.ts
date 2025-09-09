import { Injectable, Logger } from '@nestjs/common';
import { OnWorkerEvent, Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { EXPENSES_QUEUE } from '@/common/constants/queue';
import { UploadService } from '@/modules/upload/upload.service';
import { OcrService } from '@/modules/ocr/ocr.service';
import { LlmService } from '@/modules/llm/llm.service';
import { ExpensesService } from '@/modules/expenses/expenses.service';
import ExpensesEventsGateway from '@/modules/sockets/expense-events.gateway';
import { CreateOcrExpenseDto } from '@/modules/expenses/dto/create-expense.dto';
import { type IExtractedData } from '@/modules/llm/types/llm';

@Injectable()
@Processor(EXPENSES_QUEUE, {
  concurrency: 3,
})
export class ExpensesConsumer extends WorkerHost {
  private readonly logger = new Logger(ExpensesConsumer.name);

  constructor(
    private readonly uploadService: UploadService,
    private readonly ocrService: OcrService,
    private readonly llmService: LlmService,
    private readonly expensesService: ExpensesService,
    private readonly expensesEventsGateway: ExpensesEventsGateway,
  ) {
    super();
  }

  async process(
    job: Job<
      CreateOcrExpenseDto & {
        expenseId: string;
        orgId: string;
        userId: string;
        ocrResultId?: string;
        ocrText?: string;
        llmResultId?: string;
        analyzedData?: IExtractedData;
      }
    >,
  ): Promise<any> {
    const { expenseId, orgId, userId, photos } = job.data;

    const getPresignedUrls =
      await this.uploadService.createMultiplePresignedDownloadUrls(
        photos,
        orgId,
      );

    if (!job.data.ocrResultId || !job.data.ocrText) {
      const imageUrls = getPresignedUrls.map((psObj) => psObj.url);

      const { ocrText, ocrResultId } =
        await this.ocrService.extractText(imageUrls);

      job.data.ocrResultId = ocrResultId;
      job.data.ocrText = ocrText;

      await job.updateData(job.data);
    }

    if (!job.data.llmResultId) {
      const { data: analyzedData, llmResultId } =
        await this.llmService.analyzeData({
          ocrText: job.data.ocrText,
          ocrResultId: job.data.ocrResultId,
        });

      job.data.llmResultId = llmResultId;
      job.data.analyzedData = analyzedData;

      await job.updateData(job.data);
    }

    const createdAutoExpense = await this.expensesService.updateExpense(
      expenseId,
      userId,
      orgId,
      {
        ...job.data.analyzedData,
        ocrResultId: job.data.ocrResultId,
        llmResultId: job.data.llmResultId,
        processingStatus: 'completed',
      },
    );

    this.expensesEventsGateway.notifyCreatedExpense(orgId, userId, {
      id: createdAutoExpense.id,
      organization_id: orgId,
      merchant_name: createdAutoExpense.merchantName,
      amount: createdAutoExpense.amount,
    });
  }

  @OnWorkerEvent('active')
  onActive(job: Job<CreateOcrExpenseDto & { expenseId: string }>) {
    this.logger.log(
      `Processing job ${job.id} of type ${job.name} with expenseId: ${job.data.expenseId}`,
    );
  }

  @OnWorkerEvent('completed')
  onCompleted(job: Job<CreateOcrExpenseDto & { expenseId: string }>) {
    this.logger.log(
      `Job ${job.id} of type ${job.name} with expenseId: ${job.data.expenseId} has completed`,
    );
  }

  @OnWorkerEvent('failed')
  async onFailed(
    job: Job<
      CreateOcrExpenseDto & {
        expenseId: string;
        orgId: string;
        userId: string;
      }
    >,
  ) {
    const { expenseId, orgId, userId } = job.data;

    if (job.attemptsMade >= (job.opts.attempts || 3)) {
      this.logger.error(
        `Job ${job.id} has reached the maximum number of retries. Marking expense as failed.`,
      );

      await this.expensesService.updateExpense(expenseId, userId, orgId, {
        processingStatus: 'failed',
        merchantName: 'Processing Failed',
      });
    } else {
      this.logger.error(
        `Retrying failed job ${job.id}: Attempt ${job.attemptsMade} of ${job.opts.attempts || 3}`,
      );
    }
  }

  @OnWorkerEvent('stalled')
  onStalled(job: Job<CreateOcrExpenseDto & { expenseId: string }>) {
    this.logger.warn(
      `Job ${job.id} of type ${job.name} with expenseId: ${job.data.expenseId} is stalled`,
    );
  }
}
