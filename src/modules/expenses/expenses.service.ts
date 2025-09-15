import {
  ForbiddenException,
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
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
import ExpenseEventsGateway from '@/modules/sockets/expense-events.gateway';
import { type ProcessingStatus } from '@/database/types/db';
import { DEFAULT_CATEGORY_ID_CONFIG_KEY } from '@/config/keys.config';

@Injectable()
export class ExpensesService {
  private readonly logger = new Logger(ExpensesService.name);
  private readonly defaultCategoryId: string;

  constructor(
    private readonly configService: ConfigService,
    private readonly expensesRepository: ExpensesRepository,
    private readonly queueService: QueueService,
    private readonly expensesEventsGateway: ExpenseEventsGateway,
  ) {
    this.defaultCategoryId = this.configService.get<string>(
      DEFAULT_CATEGORY_ID_CONFIG_KEY,
    )!;
  }

  async createExpense(
    orgId: string,
    userId: string,
    payload: CreateExpenseDto & {
      processingStatus: ProcessingStatus;
      verifiedBy?: string;
      verifiedAt?: Date;
    },
  ): Promise<{
    id: string;
    organization_id: string;
    merchant_name: string;
    amount: number;
  }> {
    const expense = await this.expensesRepository.create(
      orgId,
      userId,
      payload,
    );

    return expense;
  }

  async createManualExpense(
    orgId: string,
    userId: string,
    dto: CreateManualExpenseDto,
  ) {
    const payload: CreateExpenseDto & {
      processingStatus: ProcessingStatus;
      verifiedBy?: string;
      verifiedAt?: Date;
    } = {
      ...dto,
      source: 'manual',
      processingStatus: 'completed',
    };

    if (dto.status === 'verified') {
      payload.status = 'verified';
      Object.assign(payload, {
        verifiedBy: userId,
        verifiedAt: new Date(),
      });
    }

    const expense = await this.createExpense(orgId, userId, payload);

    this.expensesEventsGateway.notifyCreatedExpense(orgId, userId, expense);

    return expense;
  }

  async createAutoExpense(
    orgId: string,
    userId: string,
    dto: CreateOcrExpenseDto,
  ) {
    try {
      const expense = await this.createExpense(orgId, userId, {
        categoryId: this.defaultCategoryId,
        source: 'ocr',
        merchantName: 'Processing...',
        amount: 0.0,
        date: new Date().toISOString(),
        processingStatus: 'processing',
        ...dto,
      });

      this.expensesEventsGateway.notifyCreatedExpense(orgId, userId, expense);

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
    fromJob?: boolean,
  ): Promise<GetExpenseResDto> {
    const expense = await this.expensesRepository.findById(id, orgId);

    if (!expense) {
      throw new NotFoundException({
        message: 'Expense does not exist.',
      });
    }

    if (expense.status === 'verified') {
      throw new ForbiddenException({
        message: 'Cannot update verified expense.',
      });
    }

    if (expense.processing_status === 'processing' && !fromJob) {
      throw new ForbiddenException({
        message: 'Cannot update a processing expense.',
      });
    }

    const updatedExpense = await this.expensesRepository.update(
      id,
      userId,
      orgId,
      payload,
    );

    return plainToInstance(GetExpenseResDto, updatedExpense);
  }

  async verifyExpense(id: string, userId: string, orgId: string) {
    const verifiedExpense = await this.expensesRepository.verify(
      id,
      userId,
      orgId,
    );

    this.expensesEventsGateway.notifyVerifiedExpense(orgId, userId, {
      id: verifiedExpense.id,
      organization_id: orgId,
      merchant_name: verifiedExpense.merchant_name,
      amount: Number(verifiedExpense.amount),
    });

    return plainToInstance(GetExpenseResDto, verifiedExpense);
  }

  async deleteExpense(id: string, userId: string, orgId: string) {
    const deletedExpense = await this.expensesRepository.delete(id, orgId);

    this.expensesEventsGateway.notifyDeletedExpense(orgId, userId, {
      id,
      organization_id: orgId,
    });

    return plainToInstance(GetExpenseResDto, deletedExpense);
  }
}
