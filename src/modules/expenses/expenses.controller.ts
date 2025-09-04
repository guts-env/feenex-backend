import { ModuleRoutes } from '@/common/constants/routes';
import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Put,
  Query,
} from '@nestjs/common';
import { AllRoles } from '@/modules/auth/decorators/roles.decorator';
import { RoleProtected } from '@/modules/auth/decorators/auth.decorator';
import { ExpensesService } from '@/modules/expenses/expenses.service';
import CreateExpenseDto from '@/modules/expenses/dto/create-expense.dto';
import GetExpensesDto from '@/modules/expenses/dto/get-expenses.dto';
import UpdateExpenseDto from '@/modules/expenses/dto/update-expense.dto';
import VerifyExpenseDto from '@/modules/expenses/dto/verify-expense.dto';

@AllRoles()
@RoleProtected()
@Controller(ModuleRoutes.Expenses.Main)
export class ExpensesController {
  constructor(private readonly expensesService: ExpensesService) {}

  @Get()
  getExpenses(@Query() query: GetExpensesDto) {
    return this.expensesService.getExpenses(query);
  }

  @Get(':id')
  getExpenseById(@Param('id') id: string) {
    return this.expensesService.getExpenseById(id);
  }

  @Post()
  createExpense(@Body() createExpenseDto: CreateExpenseDto) {
    return this.expensesService.createExpense(createExpenseDto);
  }

  @Put()
  updateExpense(@Body() updateExpenseDto: UpdateExpenseDto) {
    return this.expensesService.updateExpense(updateExpenseDto);
  }

  @Patch(ModuleRoutes.Expenses.Verify)
  verifyExpense(@Body() verifyExpenseDto: VerifyExpenseDto) {
    return this.expensesService.verifyExpense(verifyExpenseDto.id);
  }

  @Delete(':id')
  deleteExpense(@Param('id') id: string) {
    return this.expensesService.deleteExpense(id);
  }
}
