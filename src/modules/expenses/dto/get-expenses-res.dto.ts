import { Expose, Type } from 'class-transformer';
import GetExpenseResDto from '@/modules/expenses/dto/get-expense-res.dto';

export default class GetExpensesResDto {
  @Expose()
  count!: number;

  @Expose()
  @Type(() => GetExpenseResDto)
  data!: GetExpenseResDto[];
}
