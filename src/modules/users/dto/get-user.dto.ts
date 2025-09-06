import { IRole } from '@/common/types/common';
import { IOrganization } from '@/modules/organizations/types/organizations';
import { Optional } from '@nestjs/common';
import { IsString, IsUUID } from 'class-validator';
import { IsNotEmpty } from 'class-validator';

export default class GetUserDto {
  @IsUUID('4')
  @IsNotEmpty()
  id!: string;

  @IsUUID('4')
  @IsNotEmpty()
  organization!: Partial<IOrganization>;

  @IsUUID('4')
  @IsNotEmpty()
  role!: Partial<IRole>;

  @IsString()
  @IsNotEmpty()
  email!: string;

  @IsString()
  @Optional()
  firstName!: string;

  @IsString()
  @Optional()
  middleName!: string;

  @IsString()
  @Optional()
  lastName!: string;
}
