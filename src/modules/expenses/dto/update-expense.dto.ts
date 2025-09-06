import { IsEnum, IsOptional } from 'class-validator';
import { PartialType } from '@nestjs/mapped-types';
import { CreateExpenseDto } from '@/modules/expenses/dto/create-expense.dto';
import { ExpenseStatusEnum } from '@/common/constants/enums';

export default class UpdateExpenseDto extends PartialType(CreateExpenseDto) {
  @IsOptional()
  @IsEnum(ExpenseStatusEnum)
  status!: ExpenseStatusEnum;
}
