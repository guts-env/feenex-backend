import { Injectable } from '@nestjs/common';
import GetExpensesDto from '@/modules/expenses/dto/get-expenses.dto';
import CreateExpenseDto from '@/modules/expenses/dto/create-expense.dto';
import UpdateExpenseDto from '@/modules/expenses/dto/update-expense.dto';

@Injectable()
export class ExpensesService {
  getExpenses(dto: GetExpensesDto) {
    console.log(dto);
    throw new Error('Method not implemented.');
  }
  getExpenseById(id: string) {
    console.log(id);
    throw new Error('Method not implemented.');
  }
  createExpense(dto: CreateExpenseDto) {
    console.log(dto);
    throw new Error('Method not implemented.');
  }
  updateExpense(dto: UpdateExpenseDto) {
    console.log(dto);
    throw new Error('Method not implemented.');
  }
  verifyExpense(id: string) {
    console.log(id);
    throw new Error('Method not implemented.');
  }
  deleteExpense(id: string) {
    console.log(id);
    throw new Error('Method not implemented.');
  }
}
