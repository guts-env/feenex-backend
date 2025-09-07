import { Expose } from 'class-transformer';

export default class BaseCategoryResDto {
  @Expose()
  id!: string;

  @Expose()
  name!: string;
}
