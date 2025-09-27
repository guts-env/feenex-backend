import { IsNotEmpty, IsString } from 'class-validator';
import { Trim } from '@/common/decorators/trim.decorator';

export default class UpdateOrganizationDto {
  @Trim()
  @IsString()
  @IsNotEmpty()
  name!: string;
}
