import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { OrganizationRepository } from '@/modules/organizations/organizations.repository';
import GetMembersDto from '@/modules/organizations/dto/get-members.dto';
import UpdateOrganizationDto from '@/modules/organizations/dto/update-organization.dto';
import RemoveMemberDto from '@/modules/organizations/dto/remove-member.dto';
import UpdateMemberRoleDto from '@/modules/organizations/dto/update-member-role.dto';
import { type IRepositoryOrganization } from '@/modules/organizations/types/organizations';
import { type IRepositoryUser } from '@/modules/users/types/users';

@Injectable()
export class OrganizationsService {
  constructor(private readonly orgRepository: OrganizationRepository) {}

  async findByUserId(id: string): Promise<IRepositoryOrganization[]> {
    const userOrgs = await this.orgRepository.findByUserId(id);

    if (!userOrgs.length) {
      throw new NotFoundException({
        message: 'User has no organizations.',
      });
    }

    return userOrgs;
  }

  async findById(id: string): Promise<IRepositoryOrganization> {
    const organization = await this.orgRepository.findById(id);

    if (!organization) {
      throw new NotFoundException({
        message: 'Organization does not exist.',
      });
    }

    return organization;
  }

  async findByIdAndUpdate(
    id: string,
    dto: UpdateOrganizationDto,
  ): Promise<IRepositoryOrganization> {
    const organization = await this.orgRepository.findByIdAndUpdate(id, dto);

    if (!organization) {
      throw new NotFoundException({
        message: 'Organization does not exist.',
      });
    }

    return organization;
  }

  async getMembers(
    userId: string,
    organizationId: string,
    query: GetMembersDto,
  ): Promise<IRepositoryUser[]> {
    const members = await this.orgRepository.getMembers(
      userId,
      organizationId,
      query,
    );

    if (!members.length) {
      throw new NotFoundException({
        message: 'No members found.',
      });
    }

    return members;
  }

  async updateMemberRole(dto: UpdateMemberRoleDto) {
    return this.orgRepository.updateMemberRole(dto);
  }

  async removeMember(userId: string, orgId: string, dto: RemoveMemberDto) {
    if (userId === dto.userId) {
      throw new BadRequestException({
        message: 'You cannot remove yourself from the organization.',
      });
    }

    return this.orgRepository.removeMember(orgId, dto);
  }
}
