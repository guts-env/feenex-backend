import { IsNotEmpty, IsUUID } from 'class-validator';

export default class VerifyExpenseDto {
  @IsUUID('4')
  @IsNotEmpty()
  id: string;
}
