import { Injectable } from '@nestjs/common';
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
      source: 'manual',
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
    console.log(verifiedExpense);
    return plainToInstance(GetExpenseResDto, verifiedExpense);
  }

  deleteExpense(id: string, orgId: string) {
    return this.expensesRepository.delete(id, orgId);
  }
}
