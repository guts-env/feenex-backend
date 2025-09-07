import { Expose } from 'class-transformer';

export default class RoleResDto {
  @Expose()
  id!: string;

  @Expose()
  name!: string;
}
