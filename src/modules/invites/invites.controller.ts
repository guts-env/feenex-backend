import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Post,
  Request,
} from '@nestjs/common';
import { ModuleRoutes } from '@/common/constants/routes';
import { InvitesService } from '@/modules/invites/invites.service';
import CreateInviteDto from '@/modules/invites/dto/create-invite.dto';
import { BusinessOnly } from '@/modules/auth/decorators/roles.decorator';
import { RoleProtected } from '@/modules/auth/decorators/auth.decorator';
import { type IAuthenticatedRequest } from '@/modules/auth/types/auth';

@BusinessOnly()
@RoleProtected()
@Controller(ModuleRoutes.Invites.Main)
export class InvitesController {
  constructor(private readonly invitesService: InvitesService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  createInvite(
    @Request() req: IAuthenticatedRequest,
    @Body() dto: CreateInviteDto,
  ) {
    return this.invitesService.createInvite(
      req.user.organization.id,
      req.user.sub,
      dto,
    );
  }
}
