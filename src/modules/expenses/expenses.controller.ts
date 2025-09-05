import { ModuleRoutes } from '@/common/constants/routes';
import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Put,
  Query,
  Request,
} from '@nestjs/common';
import { AllRoles } from '@/modules/auth/decorators/roles.decorator';
import { RoleProtected } from '@/modules/auth/decorators/auth.decorator';
import { CurrentOrganization } from '@/common/decorators/current-org.decorator';
import { ExpensesService } from '@/modules/expenses/expenses.service';
import {
  CreateManualExpenseDto,
  CreateOcrExpenseDto,
} from '@/modules/expenses/dto/create-expense.dto';
import GetExpensesDto from '@/modules/expenses/dto/get-expenses.dto';
import UpdateExpenseDto from '@/modules/expenses/dto/update-expense.dto';
import GetExpenseResDto from '@/modules/expenses/dto/get-expense-res.dto';
import { type IAuthenticatedRequest } from '@/modules/auth/types/auth';

@AllRoles()
@RoleProtected()
@Controller(ModuleRoutes.Expenses.Main)
export class ExpensesController {
  constructor(private readonly expensesService: ExpensesService) {}

  @Get()
  getExpenses(
    @Request() req: IAuthenticatedRequest,
    @Query() query: GetExpensesDto,
  ) {
    return this.expensesService.getExpenses(req.user.organization.id, query);
  }

  @Post()
  createManualExpense(
    @Request() req: IAuthenticatedRequest,
    @Body() createExpenseDto: CreateManualExpenseDto,
  ) {
    return this.expensesService.createManualExpense(
      req.user.organization.id,
      req.user.sub,
      createExpenseDto,
    );
  }

  @Post(ModuleRoutes.Expenses.Paths.Auto)
  createAutoExpense(
    @Request() req: IAuthenticatedRequest,
    @Body() createExpenseDto: CreateOcrExpenseDto,
  ) {
    return this.expensesService.createAutoExpense(
      req.user.organization.id,
      req.user.sub,
      createExpenseDto,
    );
  }

  @Put(':id')
  updateExpense(
    @Param('id') id: string,
    @Request() req: IAuthenticatedRequest,
    @Body() updateExpenseDto: UpdateExpenseDto,
  ) {
    return this.expensesService.updateExpense(
      id,
      req.user.sub,
      req.user.organization.id,
      updateExpenseDto,
    );
  }

  @Get(':id')
  getExpenseById(
    @Param('id') id: string,
    @CurrentOrganization('id') orgId: string,
  ): Promise<GetExpenseResDto> {
    return this.expensesService.getExpenseById(id, orgId);
  }

  @Patch(':id/' + ModuleRoutes.Expenses.Paths.Verify)
  verifyExpense(
    @Param('id') id: string,
    @Request() req: IAuthenticatedRequest,
  ) {
    return this.expensesService.verifyExpense(
      id,
      req.user.sub,
      req.user.organization.id,
    );
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  deleteExpense(
    @Param('id') id: string,
    @CurrentOrganization('id') orgId: string,
  ) {
    return this.expensesService.deleteExpense(id, orgId);
  }
}
