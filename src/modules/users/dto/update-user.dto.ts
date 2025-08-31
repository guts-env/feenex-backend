import { PartialType } from '@nestjs/mapped-types';
import { CreateUserDto } from '@/modules/users/dto/create-user.dto';
import { IsString, IsUUID } from 'class-validator';

export class UpdateUserDto extends PartialType(CreateUserDto) {
  @IsUUID('4')
  id: string;

  @IsString()
  firstName: string;

  @IsString()
  middleName?: string;

  @IsString()
  lastName: string;
}
