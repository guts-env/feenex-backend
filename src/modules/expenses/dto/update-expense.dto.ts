import { IsIn, IsOptional } from 'class-validator';
import { PartialType } from '@nestjs/mapped-types';
import { CreateExpenseDto } from '@/modules/expenses/dto/create-expense.dto';
import { type ExpenseStatus } from '@/database/types/db';

export default class UpdateExpenseDto extends PartialType(CreateExpenseDto) {
  @IsOptional()
  @IsIn(['draft', 'pending', 'rejected', 'verified'])
  status?: ExpenseStatus;
}
