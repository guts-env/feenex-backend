import {
  BadRequestException,
  ConflictException,
  Injectable,
} from '@nestjs/common';
import { InvitesRepository } from '@/modules/invites/invites.repository';
import { UsersService } from '@/modules/users/users.service';
import CreateInviteDto from '@/modules/invites/dto/create-invite.dto';
import { type IRepositoryInvite } from '@/modules/invites/types/invites';

@Injectable()
export class InvitesService {
  constructor(
    private readonly invitesRepository: InvitesRepository,
    private readonly usersService: UsersService,
  ) {}

  async findByEmail(email: string): Promise<IRepositoryInvite | null> {
    return this.invitesRepository.findByEmail(email);
  }

  async createInvite(orgId: string, userId: string, dto: CreateInviteDto) {
    const userExists = await this.usersService.findByEmail(dto.email, true);
    if (userExists) {
      const user = await this.usersService.findByEmail(dto.email);
      if (user!.id === userId) {
        throw new BadRequestException({
          message: 'You cannot invite yourself.',
        });
      }

      if (user?.organization.id === orgId) {
        throw new ConflictException({
          message: 'Email already exists in this organization.',
        });
      }
    }

    const existingInvite = await this.findByEmail(dto.email);
    if (existingInvite) {
      throw new ConflictException({
        message: 'This email has already been invited.',
      });
    }

    return this.invitesRepository.createInvite(orgId, userId, dto);
  }
}
