import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Query,
  Request,
} from '@nestjs/common';
import { ModuleRoutes } from '@/common/constants/routes';
import { OrganizationsService } from './organizations.service';
import {
  AdminsOnly,
  AllRoles,
  BusinessOnly,
} from '@/modules/auth/decorators/roles.decorator';
import { RoleProtected } from '@/modules/auth/decorators/auth.decorator';
import GetOrganizationDto from '@/modules/organizations/dto/get-organization-res.dto';
import UpdateOrganizationDto from '@/modules/organizations/dto/update-organization.dto';
import GetMembersDto from '@/modules/organizations/dto/get-members.dto';
import UpdateMemberRoleDto from '@/modules/organizations/dto/update-member-role.dto';
import GetMembersResDto from '@/modules/organizations/dto/get-members-res.dto';
import { type IAuthenticatedRequest } from '@/modules/auth/types/auth';

@AllRoles()
@RoleProtected()
@Controller(ModuleRoutes.Organizations.Main)
export class OrganizationsController {
  constructor(private readonly organizationsService: OrganizationsService) {}
  @BusinessOnly()
  @Get(ModuleRoutes.Organizations.Paths.Members)
  getMembers(
    @Request() req: IAuthenticatedRequest,
    @Query() query: GetMembersDto,
  ): Promise<GetMembersResDto> {
    return this.organizationsService.getMembers(
      req.user.sub,
      req.user.organization.id,
      query,
    );
  }

  @BusinessOnly()
  @Delete(':id/' + ModuleRoutes.Organizations.Paths.Members)
  @HttpCode(HttpStatus.NO_CONTENT)
  removeMember(
    @Param('id') removedUserId: string,
    @Request() req: IAuthenticatedRequest,
  ) {
    return this.organizationsService.removeMember(
      req.user.sub,
      req.user.organization.id,
      removedUserId,
    );
  }

  @BusinessOnly()
  @Patch(':id/' + ModuleRoutes.Organizations.Paths.MemberRole)
  updateMemberRole(
    @Param('id') updatedUserId: string,
    @Body() dto: UpdateMemberRoleDto,
  ) {
    return this.organizationsService.updateMemberRole(updatedUserId, dto);
  }

  @Get(':id')
  getOrganization(@Param('id') id: string): Promise<GetOrganizationDto> {
    return this.organizationsService.findById(id);
  }

  @AdminsOnly()
  @Patch(':id')
  updateOrganization(
    @Param('id') id: string,
    @Body() dto: UpdateOrganizationDto,
  ): Promise<GetOrganizationDto> {
    return this.organizationsService.findByIdAndUpdate(id, dto);
  }
}
