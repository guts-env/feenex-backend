import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { plainToInstance } from 'class-transformer';
import { OrganizationRepository } from '@/modules/organizations/organizations.repository';
import GetMembersDto from '@/modules/organizations/dto/get-members.dto';
import UpdateOrganizationDto from '@/modules/organizations/dto/update-organization.dto';
import UpdateMemberRoleDto from '@/modules/organizations/dto/update-member-role.dto';
import GetMembersResDto from '@/modules/organizations/dto/get-members-res.dto';
import GetOrganizationResDto from '@/modules/organizations/dto/get-organization-res.dto';

@Injectable()
export class OrganizationsService {
  constructor(private readonly orgRepository: OrganizationRepository) {}

  async findByUserId(userId: string): Promise<GetOrganizationResDto[]> {
    const userOrgs = await this.orgRepository.findByUserId(userId);

    if (!userOrgs.length) {
      throw new NotFoundException({
        message: 'User has no organizations.',
      });
    }

    return plainToInstance(GetOrganizationResDto, userOrgs);
  }

  async findById(id: string): Promise<GetOrganizationResDto> {
    const organization = await this.orgRepository.findById(id);

    if (!organization) {
      throw new NotFoundException({
        message: 'Organization does not exist.',
      });
    }

    return plainToInstance(GetOrganizationResDto, organization);
  }

  async findByIdAndUpdate(
    id: string,
    dto: UpdateOrganizationDto,
  ): Promise<GetOrganizationResDto> {
    const organization = await this.orgRepository.findByIdAndUpdate(id, dto);

    if (!organization) {
      throw new NotFoundException({
        message: 'Organization does not exist.',
      });
    }

    return plainToInstance(GetOrganizationResDto, organization);
  }

  async getMembers(
    userId: string,
    organizationId: string,
    query: GetMembersDto,
  ): Promise<GetMembersResDto> {
    const members = await this.orgRepository.getMembers(
      userId,
      organizationId,
      query,
    );

    return plainToInstance(GetMembersResDto, {
      count: members.count,
      data: members.data.map((member) => ({
        ...member,
        role: {
          id: member.role_id,
          name: member.role_name,
        },
      })),
    });
  }

  async updateMemberRole(updatedUserId: string, dto: UpdateMemberRoleDto) {
    return this.orgRepository.updateMemberRole(updatedUserId, dto);
  }

  async removeMember(userId: string, orgId: string, removedUserId: string) {
    if (userId === removedUserId) {
      throw new BadRequestException({
        message: 'You cannot remove yourself from the organization.',
      });
    }

    const userOrgs = await this.orgRepository.findByUserId(removedUserId);
    if (!userOrgs.find((org) => org.id === orgId)) {
      throw new NotFoundException({
        message: 'User is not a member of the organization.',
      });
    }

    return this.orgRepository.removeMember(orgId, removedUserId);
  }

  async getOrganizationWithPlan(organizationId: string) {
    return this.orgRepository.findByIdWithPlan(organizationId);
  }

  async getMemberCount(organizationId: string): Promise<number> {
    return this.orgRepository.getMemberCount(organizationId);
  }
}
