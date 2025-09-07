import { Expose } from 'class-transformer';
import { type OrganizationType } from '@/database/types/db';

export default class UserOrganizationResDto {
  @Expose()
  id!: string;

  @Expose()
  name!: string;

  @Expose()
  type!: OrganizationType;
}
