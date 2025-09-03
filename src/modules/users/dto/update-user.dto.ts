import { PartialType, OmitType } from '@nestjs/mapped-types';
import { CreateUserDto } from '@/modules/users/dto/create-user.dto';
import { IsUUID } from 'class-validator';

export class UpdateUserDto extends PartialType(
  OmitType(CreateUserDto, ['email', 'password'] as const),
) {
  @IsUUID('4', { message: 'Invalid user ID format' })
  id: string;
}
