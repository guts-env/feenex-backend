import {
  IsArray,
  IsDateString,
  IsDecimal,
  IsJSON,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
} from 'class-validator';
import {
  type IExpenseItem,
  type IExpenseOtherDetails,
} from '@/modules/expenses/types/expenses';

export default class CreateExpenseDto {
  @IsOptional()
  @IsUUID('4')
  categoryId: string;

  @IsString()
  @IsOptional()
  merchantName: string;

  @IsDecimal({ decimal_digits: '2', force_decimal: true })
  @IsNotEmpty()
  amount: number;

  @IsDateString()
  @IsNotEmpty()
  date: string;

  @IsString()
  @IsOptional()
  description: string;

  @IsArray()
  @IsOptional()
  photos: string[];

  @IsJSON()
  @IsOptional()
  items: IExpenseItem[];

  @IsJSON()
  @IsOptional()
  otherDetails: IExpenseOtherDetails[];
}
