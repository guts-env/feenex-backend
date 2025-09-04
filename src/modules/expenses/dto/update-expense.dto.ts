import { IsEnum, IsNotEmpty, IsOptional, IsUUID } from 'class-validator';
import CreateExpenseDto from '@/modules/expenses/dto/create-expense.dto';
import { ExpenseStatusEnum } from '@/common/constants/enums';

export default class UpdateExpenseDto extends CreateExpenseDto {
  @IsUUID('4')
  @IsNotEmpty()
  id: string;

  @IsEnum(ExpenseStatusEnum)
  @IsOptional()
  status: ExpenseStatusEnum;
}
