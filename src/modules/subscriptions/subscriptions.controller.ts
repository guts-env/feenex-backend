import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  Request,
  UseGuards,
} from '@nestjs/common';
import { SubscriptionsService } from '@/modules/subscriptions/subscriptions.service';
import { SubscriptionLimitGuard } from '@/modules/auth/guards/subscription-limit.guard';
import { CreateSubscriptionDto } from '@/modules/subscriptions/dto/create-subscription.dto';
import { UpdateSubscriptionDto } from '@/modules/subscriptions/dto/update-subscription.dto';
import { GetSubscriptionsDto } from '@/modules/subscriptions/dto/get-subscriptions.dto';
import { GetSubscriptionStatsDto } from '@/modules/subscriptions/dto/get-subscription-stats.dto';
import { AdminsOnly } from '@/modules/auth/decorators/roles.decorator';
import { RoleProtected } from '@/modules/auth/decorators/auth.decorator';
import { ModuleRoutes } from '@/common/constants/routes';
import { type IAuthenticatedRequest } from '@/modules/auth/types/auth';

@AdminsOnly()
@RoleProtected()
@Controller(ModuleRoutes.Subscriptions.Main)
export class SubscriptionsController {
  constructor(private readonly subscriptionsService: SubscriptionsService) {}

  @Post()
  @UseGuards(SubscriptionLimitGuard)
  create(
    @Request() req: IAuthenticatedRequest,
    @Body() createSubscriptionDto: CreateSubscriptionDto,
  ) {
    return this.subscriptionsService.create(
      req.user.organization.id,
      req.user.sub,
      createSubscriptionDto,
    );
  }

  @Get()
  getSubscriptions(
    @Request() req: IAuthenticatedRequest,
    @Query() query: GetSubscriptionsDto,
  ) {
    return this.subscriptionsService.getSubscriptions(
      req.user.organization.id,
      query,
    );
  }

  @Get(ModuleRoutes.Subscriptions.Paths.Stats)
  getSubscriptionStats(
    @Request() req: IAuthenticatedRequest,
    @Query() query: GetSubscriptionStatsDto,
  ) {
    return this.subscriptionsService.getSubscriptionStats(
      req.user.organization.id,
      query,
    );
  }

  @Get(ModuleRoutes.Subscriptions.Paths.ActiveBilling)
  getActiveSubscriptionsBilling(@Request() req: IAuthenticatedRequest) {
    return this.subscriptionsService.getActiveSubscriptionsBilling(
      req.user.organization.id,
    );
  }

  @Get(ModuleRoutes.Subscriptions.Paths.DueForBilling)
  getSubscriptionsDueForBilling(@Request() req: IAuthenticatedRequest) {
    return this.subscriptionsService.getSubscriptionsDueForBilling(
      req.user.organization.id,
    );
  }

  @Get(':id')
  findById(@Request() req: IAuthenticatedRequest, @Param('id') id: string) {
    return this.subscriptionsService.findById(id, req.user.organization.id);
  }

  @Patch(':id')
  update(
    @Request() req: IAuthenticatedRequest,
    @Param('id') id: string,
    @Body() updateSubscriptionDto: UpdateSubscriptionDto,
  ) {
    return this.subscriptionsService.update(
      id,
      req.user.sub,
      req.user.organization.id,
      updateSubscriptionDto,
    );
  }

  @Delete(':id')
  delete(@Request() req: IAuthenticatedRequest, @Param('id') id: string) {
    return this.subscriptionsService.delete(id, req.user.organization.id);
  }
}
