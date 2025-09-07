import { Injectable, NotFoundException } from '@nestjs/common';
import { plainToInstance } from 'class-transformer';
import { UsersRepository } from '@/modules/users/users.repository';
import UserProfileDto from '@/modules/users/dto/user-profile.dto';
import {
  type IUserWithOrgAndRole,
  type IUser,
} from '@/modules/users/types/users';

@Injectable()
export class UsersService {
  constructor(private readonly userRepository: UsersRepository) {}

  async findById(id: string): Promise<UserProfileDto> {
    const user = await this.userRepository.findById(id);

    if (!user) {
      throw new NotFoundException({ message: 'User does not exist.' });
    }

    const transformedUser = this.transformRepositoryUser(user);

    return plainToInstance(UserProfileDto, transformedUser);
  }

  async findByEmail(
    email: string,
    isRegistration?: boolean,
  ): Promise<IUser | null> {
    const user = await this.userRepository.findByEmail(email, isRegistration);

    if (!user) {
      if (!isRegistration) {
        throw new NotFoundException({ message: 'User does not exist.' });
      }

      return null;
    }

    return this.transformRepositoryUser(user as IUserWithOrgAndRole);
  }

  transformRepositoryUser(user: IUserWithOrgAndRole): IUser {
    const { org_id, org_name, org_type, role_id, role_name } = user;

    return {
      ...user,
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
}
