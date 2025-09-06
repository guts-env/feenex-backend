import { IsNotEmpty, IsString, IsUUID } from 'class-validator';

export default class GetOrganizationResDto {
  @IsUUID('4')
  @IsNotEmpty()
  id!: string;

  @IsString()
  @IsNotEmpty()
  name!: string;
}
