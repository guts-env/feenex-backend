import {
  ForbiddenException,
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { plainToInstance } from 'class-transformer';
import Redis from 'ioredis';
import { startOfMonth, endOfMonth, parseISO, format } from 'date-fns';
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
import {
  GetTotalExpensesDto,
  GetTotalExpensesResDto,
} from '@/modules/expenses/dto/get-total-expenses.dto';
import { QueueService } from '@/modules/queue/queue.service';
import { RedisService } from '@/database/redis.service';
import ExpenseEventsGateway from '@/modules/sockets/expense-events.gateway';
import { UserRole, type ProcessingStatus } from '@/database/types/db';
import { DEFAULT_CATEGORY_ID_CONFIG_KEY } from '@/config/keys.config';
import { REDIS_EXPENSE_METRICS_KEY } from '@/common/constants/redis';
import { getCurrentMonthKey } from '@/utils/redis.utils';
import { ExpenseMetricEnum } from '@/common/constants/enums';
import { IBaseRepositoryExpense } from './types/expenses';
import { IUserPassport } from '../auth/types/auth';

@Injectable()
export class ExpensesService {
  private readonly logger = new Logger(ExpensesService.name);
  private readonly defaultCategoryId: string;

  private readonly redisClient: Redis;

  constructor(
    private readonly configService: ConfigService,
    private readonly expensesRepository: ExpensesRepository,
    private readonly queueService: QueueService,
    private readonly expensesEventsGateway: ExpenseEventsGateway,
    private readonly redisService: RedisService,
  ) {
    this.defaultCategoryId = this.configService.get<string>(
      DEFAULT_CATEGORY_ID_CONFIG_KEY,
    )!;
    this.redisClient = this.redisService.getClient();
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

    if (this.isValidExpenseStatus(payload.status || 'pending')) {
      try {
        const expenseRecord = await this.expensesRepository.findById(
          expense.id,
          orgId,
        );
        const createdAt = new Date(expenseRecord.created_at);
        const paymentDate = payload.invoiceDate
          ? parseISO(payload.invoiceDate)
          : new Date(expenseRecord.payment_date);

        await Promise.all([
          this.incrementManualExpensesCount(orgId, createdAt),
          this.updateTotalExpenseAmount(orgId, expense.amount, paymentDate),
          payload.status === 'verified'
            ? this.updateVerifiedExpenseAmount(
                orgId,
                expense.amount,
                paymentDate,
              )
            : this.updateUnverifiedExpenseAmount(
                orgId,
                expense.amount,
                paymentDate,
              ),
        ]);
      } catch (error) {
        this.logger.warn(
          'Failed to update cache metrics for manual expense:',
          error,
        );
      }
    }

    this.expensesEventsGateway.notifyCreatedExpense(orgId, userId, expense);

    return expense;
  }

  async createAutoExpense(user: IUserPassport, dto: CreateOcrExpenseDto) {
    try {
      const expense = await this.createExpense(user.organization.id, user.sub, {
        categoryId: this.defaultCategoryId,
        source: 'ocr',
        merchantName: 'Processing...',
        amount: 0.0,
        invoiceDate: new Date().toISOString(),
        processingStatus: 'processing',
        ...dto,
      });

      this.expensesEventsGateway.notifyCreatedExpense(
        user.organization.id,
        user.sub,
        expense,
      );

      await this.queueService.addExpenseJob(expense.id, user, dto);
    } catch (error) {
      this.logger.error(error);
      throw new InternalServerErrorException(
        'Something went wrong while creating the expense',
      );
    }
  }

  async getExpenses(
    orgId: string,
    roleName: UserRole,
    query: GetExpensesDto,
  ): Promise<GetExpensesResDto> {
    const res = await this.expensesRepository.getExpenses(
      orgId,
      roleName,
      query,
    );

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
    user: IUserPassport,
    payload: UpdateExpenseDto & { processingStatus?: ProcessingStatus },
    fromJob?: boolean,
  ): Promise<GetExpenseResDto> {
    if (payload.status === 'verified' && user.role.name === 'member') {
      throw new ForbiddenException({
        message: 'Organization members cannot verify expenses.',
      });
    }

    const expense = await this.expensesRepository.findById(
      id,
      user.organization.id,
    );

    if (!expense) {
      throw new NotFoundException({
        message: 'Expense does not exist.',
      });
    }

    if (expense.processing_status === 'processing' && !fromJob) {
      throw new ForbiddenException({
        message: 'Cannot update a processing expense.',
      });
    }

    const updatedExpense = await this.expensesRepository.update(
      id,
      user.sub,
      user.organization.id,
      payload,
    );

    try {
      await this.handleExpenseUpdateCaching(
        expense,
        updatedExpense,
        user.organization.id,
        fromJob,
      );
    } catch (error) {
      this.logger.warn(
        'Failed to update cache metrics for expense update:',
        error,
      );
    }

    return plainToInstance(GetExpenseResDto, updatedExpense);
  }

  async verifyExpense(id: string, user: IUserPassport) {
    const verifiedExpense = await this.expensesRepository.verify(
      id,
      user.sub,
      user.organization.id,
    );

    try {
      const paymentDate = new Date(verifiedExpense.payment_date);
      await Promise.all([
        this.updateVerifiedExpenseAmount(
          user.organization.id,
          Number(verifiedExpense.amount),
          paymentDate,
        ),
        this.updateUnverifiedExpenseAmount(
          user.organization.id,
          -Number(verifiedExpense.amount),
          paymentDate,
        ),
      ]);
    } catch (error) {
      this.logger.warn(
        'Failed to update cache metrics for expense verification:',
        error,
      );
    }

    this.expensesEventsGateway.notifyVerifiedExpense(
      user.organization.id,
      user.sub,
      {
        id: verifiedExpense.id,
        organization_id: user.organization.id,
        merchant_name: verifiedExpense.merchant_name,
        amount: Number(verifiedExpense.amount),
      },
    );

    return plainToInstance(GetExpenseResDto, verifiedExpense);
  }

  async deleteExpense(id: string, user: IUserPassport) {
    const expense = await this.expensesRepository.findById(
      id,
      user.organization.id,
    );

    if (!expense) {
      throw new NotFoundException({
        message: 'Expense does not exist.',
      });
    }

    if (expense.status === 'verified' && user.role.name === 'member') {
      throw new ForbiddenException({
        message: 'Organization members cannot delete verified expenses.',
      });
    }

    const deletedExpense = await this.expensesRepository.delete(
      id,
      user.organization.id,
    );

    if (this.isValidExpenseStatus(deletedExpense.status)) {
      try {
        const createdAt = new Date(deletedExpense.created_at);
        const paymentDate = new Date(deletedExpense.payment_date);

        const cacheUpdates: Promise<any>[] = [
          this.updateTotalExpenseAmount(
            user.organization.id,
            -Number(deletedExpense.amount),
            paymentDate,
          ),
        ];

        if (deletedExpense.source === 'manual') {
          const countMonthKey = format(createdAt, 'yyyy-MM');
          cacheUpdates.push(
            this.redisClient.decr(
              this.getExpenseMetricKey(
                user.organization.id,
                ExpenseMetricEnum.MANUAL_COUNT,
                countMonthKey,
              ),
            ),
          );
        } else if (deletedExpense.source === 'ocr') {
          const countMonthKey = format(createdAt, 'yyyy-MM');
          cacheUpdates.push(
            this.redisClient.decr(
              this.getExpenseMetricKey(
                user.organization.id,
                ExpenseMetricEnum.AUTO_COUNT,
                countMonthKey,
              ),
            ),
          );
        }

        if (deletedExpense.status === 'verified') {
          cacheUpdates.push(
            this.updateVerifiedExpenseAmount(
              user.organization.id,
              -Number(deletedExpense.amount),
              paymentDate,
            ),
          );
        } else {
          cacheUpdates.push(
            this.updateUnverifiedExpenseAmount(
              user.organization.id,
              -Number(deletedExpense.amount),
              paymentDate,
            ),
          );
        }

        await Promise.all(cacheUpdates);
      } catch (error) {
        this.logger.warn(
          'Failed to update cache metrics for expense deletion:',
          error,
        );
      }
    }

    this.expensesEventsGateway.notifyDeletedExpense(
      user.organization.id,
      user.sub,
      {
        id,
        organization_id: user.organization.id,
      },
    );

    return plainToInstance(GetExpenseResDto, deletedExpense);
  }

  async getTotalExpenses(
    orgId: string,
    dto: GetTotalExpensesDto,
  ): Promise<GetTotalExpensesResDto> {
    const monthKey = this.getMonthKeyFromDateRange(dto);

    if (monthKey) {
      try {
        const cachedMetrics = await this.getMonthMetrics(orgId, monthKey);

        if (
          cachedMetrics.totalAmount > 0 ||
          cachedMetrics.manualCount > 0 ||
          cachedMetrics.autoCount > 0 ||
          cachedMetrics.verifiedAmount > 0 ||
          cachedMetrics.unverifiedAmount > 0
        ) {
          return plainToInstance(GetTotalExpensesResDto, {
            total: cachedMetrics.totalAmount,
            count: cachedMetrics.manualCount + cachedMetrics.autoCount,
            receiptsProcessed: cachedMetrics.autoCount,
            verified: cachedMetrics.verifiedAmount,
            unverified: cachedMetrics.unverifiedAmount,
            dateRange: {
              startDate: new Date(dto.startDate!),
              endDate: new Date(dto.endDate!),
            },
          });
        }
      } catch (error) {
        this.logger.warn(
          'Failed to get cached metrics, falling back to database:',
          error,
        );
      }
    }

    const result = await this.expensesRepository.getTotalExpenses(orgId, dto);

    if (monthKey && result) {
      try {
        await this.populateCacheFromResult(orgId, result, monthKey);
      } catch (error) {
        this.logger.warn(
          'Failed to populate cache with database result:',
          error,
        );
      }
    }

    return plainToInstance(GetTotalExpensesResDto, result);
  }

  private getMonthKeyFromDateRange(dto: GetTotalExpensesDto): string | null {
    if (!dto.startDate || !dto.endDate) {
      return null;
    }

    try {
      const requestStart = parseISO(dto.startDate);
      const requestEnd = parseISO(dto.endDate);

      const monthStart = startOfMonth(requestStart);
      const monthEnd = endOfMonth(requestEnd);

      if (
        requestStart.getTime() === monthStart.getTime() &&
        requestEnd.getTime() === monthEnd.getTime()
      ) {
        return format(requestStart, 'yyyy-MM');
      }

      return null;
    } catch (error) {
      this.logger.warn('Invalid date format in date range:', error);
      return null;
    }
  }

  private async populateCacheFromResult(
    orgId: string,
    result: GetTotalExpensesResDto,
    monthKey: string,
  ): Promise<void> {
    if (!result) return;

    const promises: Promise<any>[] = [];

    if (result.total) {
      promises.push(
        this.redisClient.set(
          this.getExpenseMetricKey(
            orgId,
            ExpenseMetricEnum.TOTAL_AMOUNT,
            monthKey,
          ),
          result.total.toString(),
        ),
      );
    }

    if (result.verified) {
      promises.push(
        this.redisClient.set(
          this.getExpenseMetricKey(
            orgId,
            ExpenseMetricEnum.VERIFIED_AMOUNT,
            monthKey,
          ),
          result.verified.toString(),
        ),
      );
    }

    if (result.unverified) {
      promises.push(
        this.redisClient.set(
          this.getExpenseMetricKey(
            orgId,
            ExpenseMetricEnum.UNVERIFIED_AMOUNT,
            monthKey,
          ),
          result.unverified.toString(),
        ),
      );
    }

    if (result.receiptsProcessed) {
      promises.push(
        this.redisClient.set(
          this.getExpenseMetricKey(
            orgId,
            ExpenseMetricEnum.AUTO_COUNT,
            monthKey,
          ),
          result.receiptsProcessed.toString(),
        ),
      );
    }

    if (result.count && result.receiptsProcessed) {
      promises.push(
        this.redisClient.set(
          this.getExpenseMetricKey(
            orgId,
            ExpenseMetricEnum.MANUAL_COUNT,
            monthKey,
          ),
          (result.count - result.receiptsProcessed).toString(),
        ),
      );
    }

    await Promise.all(promises);
  }

  private getExpenseMetricKey(
    orgId: string,
    metric: ExpenseMetricEnum,
    month?: string,
  ): string {
    const monthKey = month || getCurrentMonthKey();
    return `${REDIS_EXPENSE_METRICS_KEY}:${orgId}:${metric}:${monthKey}`;
  }

  async incrementManualExpensesCount(
    orgId: string,
    createdAt?: Date,
  ): Promise<number> {
    const monthKey = createdAt
      ? format(createdAt, 'yyyy-MM')
      : getCurrentMonthKey();
    const key = this.getExpenseMetricKey(
      orgId,
      ExpenseMetricEnum.MANUAL_COUNT,
      monthKey,
    );
    return await this.redisClient.incr(key);
  }

  async getManualExpensesCount(orgId: string, month?: string): Promise<number> {
    const key = this.getExpenseMetricKey(
      orgId,
      ExpenseMetricEnum.MANUAL_COUNT,
      month,
    );
    const count = await this.redisClient.get(key);
    return count ? parseInt(count, 10) : 0;
  }

  async incrementAutoExpensesCount(
    orgId: string,
    createdAt?: Date,
  ): Promise<number> {
    const monthKey = createdAt
      ? format(createdAt, 'yyyy-MM')
      : getCurrentMonthKey();
    const key = this.getExpenseMetricKey(
      orgId,
      ExpenseMetricEnum.AUTO_COUNT,
      monthKey,
    );
    return await this.redisClient.incr(key);
  }

  async getAutoExpensesCount(orgId: string, month?: string): Promise<number> {
    const key = this.getExpenseMetricKey(
      orgId,
      ExpenseMetricEnum.AUTO_COUNT,
      month,
    );
    const count = await this.redisClient.get(key);
    return count ? parseInt(count, 10) : 0;
  }

  async updateTotalExpenseAmount(
    orgId: string,
    amount: number,
    paymentDate?: Date,
  ): Promise<void> {
    const monthKey = paymentDate
      ? format(paymentDate, 'yyyy-MM')
      : getCurrentMonthKey();
    const key = this.getExpenseMetricKey(
      orgId,
      ExpenseMetricEnum.TOTAL_AMOUNT,
      monthKey,
    );
    await this.redisClient.incrbyfloat(key, amount);
  }

  async getTotalExpenseAmount(orgId: string, month?: string): Promise<number> {
    const key = this.getExpenseMetricKey(
      orgId,
      ExpenseMetricEnum.TOTAL_AMOUNT,
      month,
    );
    const amount = await this.redisClient.get(key);
    return amount ? parseFloat(amount) : 0;
  }

  async updateVerifiedExpenseAmount(
    orgId: string,
    amount: number,
    paymentDate?: Date,
  ): Promise<void> {
    const monthKey = paymentDate
      ? format(paymentDate, 'yyyy-MM')
      : getCurrentMonthKey();
    const key = this.getExpenseMetricKey(
      orgId,
      ExpenseMetricEnum.VERIFIED_AMOUNT,
      monthKey,
    );
    await this.redisClient.incrbyfloat(key, amount);
  }

  async getVerifiedExpenseAmount(
    orgId: string,
    month?: string,
  ): Promise<number> {
    const key = this.getExpenseMetricKey(
      orgId,
      ExpenseMetricEnum.VERIFIED_AMOUNT,
      month,
    );
    const amount = await this.redisClient.get(key);
    return amount ? parseFloat(amount) : 0;
  }

  async updateUnverifiedExpenseAmount(
    orgId: string,
    amount: number,
    paymentDate?: Date,
  ): Promise<void> {
    const monthKey = paymentDate
      ? format(paymentDate, 'yyyy-MM')
      : getCurrentMonthKey();
    const key = this.getExpenseMetricKey(
      orgId,
      ExpenseMetricEnum.UNVERIFIED_AMOUNT,
      monthKey,
    );
    await this.redisClient.incrbyfloat(key, amount);
  }

  async getUnverifiedExpenseAmount(
    orgId: string,
    month?: string,
  ): Promise<number> {
    const key = this.getExpenseMetricKey(
      orgId,
      ExpenseMetricEnum.UNVERIFIED_AMOUNT,
      month,
    );
    const amount = await this.redisClient.get(key);
    return amount ? parseFloat(amount) : 0;
  }

  private isValidExpenseStatus(status: string): boolean {
    return status === 'pending' || status === 'verified';
  }

  private async handleExpenseUpdateCaching(
    oldExpense: IBaseRepositoryExpense,
    newExpense: IBaseRepositoryExpense,
    orgId: string,
    fromJob?: boolean,
  ): Promise<void> {
    const cacheUpdates: Promise<any>[] = [];

    const oldValidStatus = this.isValidExpenseStatus(oldExpense.status);
    const newValidStatus = this.isValidExpenseStatus(newExpense.status);
    const oldAmount = Number(oldExpense.amount);
    const newAmount = Number(newExpense.amount);

    if (
      fromJob &&
      oldExpense.processing_status === 'processing' &&
      newExpense.processing_status === 'completed' &&
      newValidStatus
    ) {
      const createdAt = new Date(newExpense.created_at);
      const paymentDate = new Date(newExpense.payment_date);

      cacheUpdates.push(
        this.incrementAutoExpensesCount(orgId, createdAt),
        this.updateTotalExpenseAmount(orgId, newAmount, paymentDate),
        newExpense.status === 'verified'
          ? this.updateVerifiedExpenseAmount(orgId, newAmount, paymentDate)
          : this.updateUnverifiedExpenseAmount(orgId, newAmount, paymentDate),
      );
    } else {
      const oldPaymentDate = new Date(oldExpense.payment_date);
      const newPaymentDate = new Date(newExpense.payment_date);

      if (oldValidStatus && !newValidStatus) {
        cacheUpdates.push(
          this.updateTotalExpenseAmount(orgId, -oldAmount, oldPaymentDate),
          oldExpense.status === 'verified'
            ? this.updateVerifiedExpenseAmount(
                orgId,
                -oldAmount,
                oldPaymentDate,
              )
            : this.updateUnverifiedExpenseAmount(
                orgId,
                -oldAmount,
                oldPaymentDate,
              ),
        );
      } else if (!oldValidStatus && newValidStatus) {
        cacheUpdates.push(
          this.updateTotalExpenseAmount(orgId, newAmount, newPaymentDate),
          newExpense.status === 'verified'
            ? this.updateVerifiedExpenseAmount(orgId, newAmount, newPaymentDate)
            : this.updateUnverifiedExpenseAmount(
                orgId,
                newAmount,
                newPaymentDate,
              ),
        );
      } else if (oldValidStatus && newValidStatus) {
        const amountDiff = newAmount - oldAmount;
        const oldPaymentMonth = format(oldPaymentDate, 'yyyy-MM');
        const newPaymentMonth = format(newPaymentDate, 'yyyy-MM');
        const paymentDateChanged = oldPaymentMonth !== newPaymentMonth;

        if (amountDiff !== 0 || paymentDateChanged) {
          if (paymentDateChanged) {
            cacheUpdates.push(
              this.updateTotalExpenseAmount(orgId, -oldAmount, oldPaymentDate),
              this.updateTotalExpenseAmount(orgId, newAmount, newPaymentDate),
            );
          } else {
            cacheUpdates.push(
              this.updateTotalExpenseAmount(orgId, amountDiff, newPaymentDate),
            );
          }
        }

        const oldVerified = oldExpense.status === 'verified';
        const newVerified = newExpense.status === 'verified';

        if (oldVerified !== newVerified) {
          if (paymentDateChanged) {
            if (newVerified) {
              cacheUpdates.push(
                this.updateUnverifiedExpenseAmount(
                  orgId,
                  -oldAmount,
                  oldPaymentDate,
                ),
                this.updateVerifiedExpenseAmount(
                  orgId,
                  newAmount,
                  newPaymentDate,
                ),
              );
            } else {
              cacheUpdates.push(
                this.updateVerifiedExpenseAmount(
                  orgId,
                  -oldAmount,
                  oldPaymentDate,
                ),
                this.updateUnverifiedExpenseAmount(
                  orgId,
                  newAmount,
                  newPaymentDate,
                ),
              );
            }
          } else {
            if (newVerified) {
              cacheUpdates.push(
                this.updateVerifiedExpenseAmount(
                  orgId,
                  newAmount,
                  newPaymentDate,
                ),
                this.updateUnverifiedExpenseAmount(
                  orgId,
                  -oldAmount,
                  oldPaymentDate,
                ),
              );
            } else {
              cacheUpdates.push(
                this.updateUnverifiedExpenseAmount(
                  orgId,
                  newAmount,
                  newPaymentDate,
                ),
                this.updateVerifiedExpenseAmount(
                  orgId,
                  -oldAmount,
                  oldPaymentDate,
                ),
              );
            }
          }
        } else if (amountDiff !== 0 || paymentDateChanged) {
          if (paymentDateChanged) {
            if (newVerified) {
              cacheUpdates.push(
                this.updateVerifiedExpenseAmount(
                  orgId,
                  -oldAmount,
                  oldPaymentDate,
                ),
                this.updateVerifiedExpenseAmount(
                  orgId,
                  newAmount,
                  newPaymentDate,
                ),
              );
            } else {
              cacheUpdates.push(
                this.updateUnverifiedExpenseAmount(
                  orgId,
                  -oldAmount,
                  oldPaymentDate,
                ),
                this.updateUnverifiedExpenseAmount(
                  orgId,
                  newAmount,
                  newPaymentDate,
                ),
              );
            }
          } else {
            if (newVerified) {
              cacheUpdates.push(
                this.updateVerifiedExpenseAmount(
                  orgId,
                  amountDiff,
                  newPaymentDate,
                ),
              );
            } else {
              cacheUpdates.push(
                this.updateUnverifiedExpenseAmount(
                  orgId,
                  amountDiff,
                  newPaymentDate,
                ),
              );
            }
          }
        }
      }
    }

    if (cacheUpdates.length > 0) {
      await Promise.all(cacheUpdates);
    }
  }

  async getMonthMetrics(
    orgId: string,
    month?: string,
  ): Promise<{
    manualCount: number;
    autoCount: number;
    totalAmount: number;
    verifiedAmount: number;
    unverifiedAmount: number;
  }> {
    const [
      manualCount,
      autoCount,
      totalAmount,
      verifiedAmount,
      unverifiedAmount,
    ] = await Promise.all([
      this.getManualExpensesCount(orgId, month),
      this.getAutoExpensesCount(orgId, month),
      this.getTotalExpenseAmount(orgId, month),
      this.getVerifiedExpenseAmount(orgId, month),
      this.getUnverifiedExpenseAmount(orgId, month),
    ]);

    return {
      manualCount,
      autoCount,
      totalAmount,
      verifiedAmount,
      unverifiedAmount,
    };
  }
}
