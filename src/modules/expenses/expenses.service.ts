import { Injectable } from '@nestjs/common';
import { plainToInstance } from 'class-transformer';
import { ExpensesRepository } from '@/modules/expenses/expenses.repository';
import GetExpensesDto from '@/modules/expenses/dto/get-expenses.dto';
import GetExpensesResDto from '@/modules/expenses/dto/get-expenses-res.dto';
import {
  CreateOcrExpenseDto,
  CreateManualExpenseDto,
  CreateExpenseDto,
} from '@/modules/expenses/dto/create-expense.dto';
import UpdateExpenseDto from '@/modules/expenses/dto/update-expense.dto';
import GetExpenseResDto from '@/modules/expenses/dto/get-expense-res.dto';
import { UploadService } from '@/modules/upload/upload.service';
import { OcrService } from '@/modules/ocr/ocr.service';
import { LlmService } from '@/modules/llm/llm.service';

@Injectable()
export class ExpensesService {
  constructor(
    private readonly expensesRepository: ExpensesRepository,
    private readonly uploadService: UploadService,
    private readonly ocrService: OcrService,
    private readonly llmService: LlmService,
  ) {}

  async createExpense(orgId: string, userId: string, dto: CreateExpenseDto) {
    return this.expensesRepository.create(orgId, userId, dto);
  }

  createManualExpense(
    orgId: string,
    userId: string,
    dto: CreateManualExpenseDto,
  ) {
    return this.createExpense(orgId, userId, {
      ...dto,
      source: 'manual',
    });
  }

  async createAutoExpense(
    orgId: string,
    userId: string,
    dto: CreateOcrExpenseDto,
  ) {
    const getPresignedUrls =
      await this.uploadService.createMultiplePresignedDownloadUrls(
        dto.photos,
        orgId,
      );

    const extractedData = await Promise.all(
      getPresignedUrls.map((psObj) => this.ocrService.extractText(psObj.url)),
    );
    const combinedExtractedData = extractedData.join('\n');

    const analyzedData = await this.llmService.analyzeData(
      combinedExtractedData,
    );

    const expenseDto = analyzedData;

    return this.createExpense(orgId, userId, {
      ...dto,
      ...expenseDto,
      categoryId: '06384849-f2c8-4b5d-8992-a9f75168cdc9',
      source: 'ocr',
    });
  }

  async getExpenses(
    orgId: string,
    query: GetExpensesDto,
  ): Promise<GetExpensesResDto> {
    console.log(orgId, query);
    const res = await this.expensesRepository.getExpenses(orgId, query);
    return plainToInstance(GetExpensesResDto, {
      count: res.count,
      data: res.data,
    });
  }

  async getExpenseById(id: string, orgId: string): Promise<GetExpenseResDto> {
    const expense = await this.expensesRepository.findById(id, orgId);
    return plainToInstance(GetExpenseResDto, expense);
  }

  async updateExpense(
    id: string,
    userId: string,
    orgId: string,
    dto: UpdateExpenseDto,
  ): Promise<GetExpenseResDto> {
    const expense = await this.expensesRepository.update(
      id,
      userId,
      orgId,
      dto,
    );
    return plainToInstance(GetExpenseResDto, expense);
  }

  async verifyExpense(id: string, userId: string, orgId: string) {
    const verifiedExpense = await this.expensesRepository.verify(
      id,
      userId,
      orgId,
    );

    return plainToInstance(GetExpenseResDto, verifiedExpense);
  }

  deleteExpense(id: string, orgId: string) {
    return this.expensesRepository.delete(id, orgId);
  }
}
