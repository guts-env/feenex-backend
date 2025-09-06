import {
  IsEmail,
  IsString,
  MinLength,
  IsOptional,
  MaxLength,
} from 'class-validator';

export class CreateUserDto {
  @IsEmail({}, { message: 'Please provide a valid email address' })
  email!: string;

  @IsString({ message: 'Password must be a string' })
  @MinLength(8, { message: 'Password must be at least 8 characters long' })
  password!: string;

  @IsOptional()
  @IsString({ message: 'First name must be a string' })
  @MaxLength(255, { message: 'First name must be less than 255 characters' })
  firstName?: string;

  @IsOptional()
  @IsString({ message: 'Middle name must be a string' })
  @MaxLength(255, { message: 'Middle name must be less than 255 characters' })
  middleName?: string;

  @IsOptional()
  @IsString({ message: 'Last name must be a string' })
  @MaxLength(255, { message: 'Last name must be less than 255 characters' })
  lastName?: string;
}
