import { Injectable, NotFoundException } from '@nestjs/common';
import { UsersRepository } from '@/modules/users/users.repository';
import { type IRepositoryUser, type IUser } from '@/modules/users/types/users';

@Injectable()
export class UsersService {
  constructor(private readonly userRepository: UsersRepository) {}

  private transformRepositoryUser(user: IRepositoryUser): IUser {
    const { org_id, org_name, org_type, role_id, role_name, ...restUser } =
      user;

    return {
      ...restUser,
      organization: {
        id: org_id,
        name: org_name,
        type: org_type,
      },
      role: {
        id: role_id,
        name: role_name,
      },
    };
  }

  async findById(id: string): Promise<IUser | null> {
    const user = await this.userRepository.findById(id);

    if (!user) {
      throw new NotFoundException({ message: 'User does not exist.' });
    }

    return this.transformRepositoryUser(user);
  }

  async findByEmail(
    email: string,
    isRegistration?: boolean,
  ): Promise<IUser | null> {
    const user = await this.userRepository.findByEmail(email);

    if (!user) {
      if (!isRegistration) {
        throw new NotFoundException({ message: 'User does not exist.' });
      }

      return null;
    }

    return this.transformRepositoryUser(user);
  }
}
