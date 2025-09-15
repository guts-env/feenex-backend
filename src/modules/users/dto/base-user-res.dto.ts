import { Expose, Transform } from 'class-transformer';
import { type Users } from '@/database/types/db';

export default class UserResDto {
  @Expose()
  id!: string;

  @Expose()
  email!: string;

  @Expose()
  @Transform(({ obj }: { obj: Users }) => obj.first_name)
  firstName!: string;

  @Expose()
  @Transform(({ obj }: { obj: Users }) => obj.middle_name)
  middleName!: string;

  @Expose()
  @Transform(({ obj }: { obj: Users }) => obj.last_name)
  lastName!: string;

  @Expose()
  @Transform(({ obj }: { obj: Users }) => obj.profile_photo)
  profilePhoto!: string;
}
