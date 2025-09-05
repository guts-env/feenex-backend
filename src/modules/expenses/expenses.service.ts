import { Injectable, NotFoundException } from '@nestjs/common';
import { plainToInstance } from 'class-transformer';
import { ExpensesRepository } from '@/modules/expenses/expenses.repository';
import GetExpensesDto from '@/modules/expenses/dto/get-expenses.dto';
import GetExpensesResDto from '@/modules/expenses/dto/get-expenses-res.dto';
import {
  CreateOcrExpenseDto,
  CreateManualExpenseDto,
} from '@/modules/expenses/dto/create-expense.dto';
import UpdateExpenseDto from '@/modules/expenses/dto/update-expense.dto';
import GetExpenseResDto from '@/modules/expenses/dto/get-expense-res.dto';
import { ExpenseSourceEnum } from '@/common/constants/enums';

@Injectable()
export class ExpensesService {
  constructor(private readonly expensesRepository: ExpensesRepository) {}

  createManualExpense(
    orgId: string,
    userId: string,
    dto: CreateManualExpenseDto,
  ) {
    return this.expensesRepository.create(orgId, userId, {
      ...dto,
      source: ExpenseSourceEnum.MANUAL,
    });
  }

  createAutoExpense(orgId: string, userId: string, dto: CreateOcrExpenseDto) {
    console.log({ orgId, userId, dto });
    // return this.expensesRepository.create(orgId, userId, dto);
  }

  async getExpenses(
    orgId: string,
    query: GetExpensesDto,
  ): Promise<GetExpensesResDto> {
    const res = await this.expensesRepository.getExpenses(orgId, query);
    return plainToInstance(GetExpensesResDto, {
      count: res.length,
      data: res,
    });
  }

  async getExpenseById(id: string, orgId: string): Promise<GetExpenseResDto> {
    const expense = await this.expensesRepository.findById(id, orgId);

    if (!expense) {
      throw new NotFoundException({
        message: 'Expense does not exist.',
      });
    }

    return plainToInstance(GetExpenseResDto, expense);
  }

  async updateExpense(
    id: string,
    userId: string,
    orgId: string,
    dto: UpdateExpenseDto,
  ) {
    const hasExpense = await this.expensesRepository.findById(id, orgId);
    if (!hasExpense) {
      throw new NotFoundException({
        message: 'Expense does not exist.',
      });
    }

    return this.expensesRepository.update(id, userId, orgId, dto);
  }

  verifyExpense(id: string, userId: string, orgId: string) {
    return this.expensesRepository.verify(id, userId, orgId);
  }

  deleteExpense(id: string, orgId: string) {
    return this.expensesRepository.delete(id, orgId);
  }
}
