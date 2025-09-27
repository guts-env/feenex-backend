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
  UseGuards,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { ThrottleLimits, ThrottleNames } from '@/config/throttle.config';
import {
  AdminsOnly,
  AllRoles,
  ManagersOnly,
} from '@/modules/auth/decorators/roles.decorator';
import { RoleProtected } from '@/modules/auth/decorators/auth.decorator';
import { CurrentOrganization } from '@/common/decorators/current-org.decorator';
import { ManualExpenseLimitGuard } from '@/modules/auth/guards/manual-expense-limit.guard';
import { AutoExpenseLimitGuard } from '@/modules/auth/guards/auto-expense-limit.guard';
import { ExpensesService } from '@/modules/expenses/expenses.service';
import {
  CreateManualExpenseDto,
  CreateOcrExpenseDto,
} from '@/modules/expenses/dto/create-expense.dto';
import GetExpensesDto from '@/modules/expenses/dto/get-expenses.dto';
import UpdateExpenseDto from '@/modules/expenses/dto/update-expense.dto';
import GetExpenseResDto from '@/modules/expenses/dto/get-expense-res.dto';
import {
  GetTotalExpensesDto,
  GetTotalExpensesResDto,
} from '@/modules/expenses/dto/get-total-expenses.dto';
import { type IAuthenticatedRequest } from '@/modules/auth/types/auth';
@AllRoles()
@RoleProtected()
@Controller(ModuleRoutes.Expenses.Main)
export class ExpensesController {
  constructor(private readonly expensesService: ExpensesService) {}

  @Get()
  @HttpCode(HttpStatus.OK)
  getExpenses(
    @Request() req: IAuthenticatedRequest,
    @Query() query: GetExpensesDto,
  ) {
    return this.expensesService.getExpenses(
      req.user.organization.id,
      req.user.role.name,
      query,
    );
  }

  @AdminsOnly()
  @Get(ModuleRoutes.Expenses.Paths.Total)
  @HttpCode(HttpStatus.OK)
  getTotalExpenses(
    @Request() req: IAuthenticatedRequest,
    @Query() query: GetTotalExpensesDto,
  ): Promise<GetTotalExpensesResDto> {
    return this.expensesService.getTotalExpenses(
      req.user.organization.id,
      query,
    );
  }

  @Post()
  @UseGuards(ManualExpenseLimitGuard)
  @HttpCode(HttpStatus.CREATED)
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
  @UseGuards(AutoExpenseLimitGuard)
  @Throttle(ThrottleLimits[ThrottleNames.AUTO_EXPENSE])
  @HttpCode(HttpStatus.ACCEPTED)
  createAutoExpense(
    @Request() req: IAuthenticatedRequest,
    @Body() createExpenseDto: CreateOcrExpenseDto,
  ) {
    return this.expensesService.createAutoExpense(req.user, createExpenseDto);
  }

  @Put(':id')
  @HttpCode(HttpStatus.OK)
  updateExpense(
    @Param('id') id: string,
    @Request() req: IAuthenticatedRequest,
    @Body() updateExpenseDto: UpdateExpenseDto,
  ) {
    return this.expensesService.updateExpense(id, req.user, updateExpenseDto);
  }

  @Get(':id')
  @HttpCode(HttpStatus.OK)
  getExpenseById(
    @Param('id') id: string,
    @CurrentOrganization('id') orgId: string,
  ): Promise<GetExpenseResDto> {
    return this.expensesService.getExpenseById(id, orgId);
  }

  @Patch(':id/' + ModuleRoutes.Expenses.Paths.Verify)
  @ManagersOnly()
  @HttpCode(HttpStatus.OK)
  verifyExpense(
    @Param('id') id: string,
    @Request() req: IAuthenticatedRequest,
  ) {
    return this.expensesService.verifyExpense(id, req.user);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  deleteExpense(
    @Param('id') id: string,
    @Request() req: IAuthenticatedRequest,
  ) {
    return this.expensesService.deleteExpense(id, req.user);
  }
}
