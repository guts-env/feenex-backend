import { IsArray, IsNumber } from 'class-validator';
import GetExpenseDto from '@/modules/expenses/dto/get-expense.dto';

export default class GetExpensesDto {
  @IsNumber()
  count: number;

  @IsArray()
  data: GetExpenseDto[];
}
