import { Injectable, NotFoundException } from '@nestjs/common';
import { OrganizationRepository } from '@/modules/organizations/organizations.repository';
import { IRepositoryOrganization } from '@/modules/organizations/types/organizations';

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
}
