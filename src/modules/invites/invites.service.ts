import {
  BadRequestException,
  ConflictException,
  Injectable,
} from '@nestjs/common';
import { createHash, randomBytes } from 'crypto';
import { InvitesRepository } from '@/modules/invites/invites.repository';
import { UsersService } from '@/modules/users/users.service';
import { EmailService } from '@/modules/email/email.service';
import CreateInviteDto from '@/modules/invites/dto/create-invite.dto';
import { type IRepositoryInvite } from '@/modules/invites/types/invites';

@Injectable()
export class InvitesService {
  constructor(
    private readonly invitesRepository: InvitesRepository,
    private readonly usersService: UsersService,
    private readonly emailService: EmailService,
  ) {}

  async findByEmail(email: string): Promise<IRepositoryInvite | null> {
    return this.invitesRepository.findByEmail(email);
  }

  async findByToken(token: string): Promise<IRepositoryInvite | null> {
    return this.invitesRepository.findByToken(token);
  }

  async createInvite(
    orgId: string,
    orgName: string,
    userId: string,
    dto: CreateInviteDto,
  ) {
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

    const token = this.generateInviteToken();

    const invite = await this.invitesRepository.createInvite(
      orgId,
      userId,
      dto,
      token,
    );

    const inviteLink = `https://feenex.com/auth/register?inviteId=${invite.id}`;
    await this.emailService.sendInviteEmail(dto.email, orgName, inviteLink);
  }

  private generateInviteToken(): string {
    const token = randomBytes(32).toString('base64url');
    return token;
  }

  private hashToken(token: string): string {
    return createHash('sha256').update(token).digest('hex');
  }
}
