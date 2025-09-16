import { PartialType } from '@nestjs/mapped-types';
import { CreateExpenseDto } from '@/modules/expenses/dto/create-expense.dto';

export default class UpdateExpenseDto extends PartialType(CreateExpenseDto) {}
