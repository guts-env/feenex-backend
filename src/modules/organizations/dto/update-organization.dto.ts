import { IsNotEmpty, IsString } from 'class-validator';

export default class UpdateOrganizationDto {
  @IsString()
  @IsNotEmpty()
  name: string;
}
