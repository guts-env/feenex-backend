import {
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
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
import { QueueService } from '@/modules/queue/queue.service';
import { type ProcessingStatus } from '@/database/types/db';

@Injectable()
export class ExpensesService {
  private readonly logger = new Logger(ExpensesService.name);

  constructor(
    private readonly expensesRepository: ExpensesRepository,
    private readonly queueService: QueueService,
  ) {}

  async createExpense(
    orgId: string,
    userId: string,
    payload: CreateExpenseDto & { processingStatus: ProcessingStatus },
  ): Promise<{ id: string }> {
    const expense = await this.expensesRepository.create(
      orgId,
      userId,
      payload,
    );

    return expense;
  }

  createManualExpense(
    orgId: string,
    userId: string,
    dto: CreateManualExpenseDto,
  ) {
    return this.createExpense(orgId, userId, {
      ...dto,
      source: 'manual',
      processingStatus: 'completed',
    });
  }

  async createAutoExpense(
    orgId: string,
    userId: string,
    dto: CreateOcrExpenseDto,
  ) {
    try {
      const expense = await this.createExpense(orgId, userId, {
        categoryId: 'd2a95b07-9356-4772-ab3a-193765c501a9',
        source: 'ocr',
        merchantName: 'Processing...',
        amount: '0.00',
        date: new Date().toISOString(),
        processingStatus: 'processing',
        ...dto,
      });

      console.log(expense);

      await this.queueService.addExpenseJob(expense.id, orgId, userId, dto);
    } catch (error) {
      this.logger.error(error);
      throw new InternalServerErrorException(
        'Something went wrong while creating the expense',
      );
    }
  }

  async getExpenses(
    orgId: string,
    query: GetExpensesDto,
  ): Promise<GetExpensesResDto> {
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
    payload: UpdateExpenseDto & { processingStatus?: ProcessingStatus },
  ): Promise<GetExpenseResDto> {
    const expense = await this.expensesRepository.update(
      id,
      userId,
      orgId,
      payload,
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
