import { Injectable, NotFoundException } from '@nestjs/common';
import { UsersRepository } from '@/modules/users/users.repository';
import { type CreateUserInput, type User } from '@/modules/users/types/users';

@Injectable()
export class UsersService {
  constructor(private readonly userRepository: UsersRepository) {}

  async create(user: CreateUserInput) {
    await this.userRepository.create(user);
  }

  async findById(id: string): Promise<User | null> {
    const user = await this.userRepository.findById(id);

    if (!user) {
      throw new NotFoundException({ message: 'User does not exist.' });
    }

    return user;
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.userRepository.findByEmail(email);
  }
}
