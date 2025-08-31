import { Injectable } from '@nestjs/common';
import { UsersRepository } from '@/modules/users/users.repository';
import { BaseUser, User } from '@/modules/users/types/users';

@Injectable()
export class UsersService {
  constructor(private readonly userRepository: UsersRepository) {}

  async create(user: BaseUser) {
    await this.userRepository.create(user);
  }

  async findByEmail(email: string): Promise<User | null> {
    const user = await this.userRepository.findByEmail(email);
    return user;
  }
}
