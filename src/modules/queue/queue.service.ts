import { EXPENSES_QUEUE, PROCESS_EXPENSES_JOB } from '@/common/constants/queue';
import { InjectQueue } from '@nestjs/bullmq';
import { Injectable } from '@nestjs/common';
import { Queue } from 'bullmq';
import { CreateOcrExpenseDto } from '@/modules/expenses/dto/create-expense.dto';
import { IUserPassport } from '../auth/types/auth';

@Injectable()
export class QueueService {
  constructor(
    @InjectQueue(EXPENSES_QUEUE) private readonly expensesQueue: Queue,
  ) {}

  async addExpenseJob(
    expenseId: string,
    user: IUserPassport,
    dto: CreateOcrExpenseDto,
  ) {
    const job = await this.expensesQueue.add(PROCESS_EXPENSES_JOB, {
      expenseId,
      user,
      ...dto,
    });

    return job;
  }
}
