import {
  IsEmail,
  IsString,
  MinLength,
  MaxLength,
  ValidateIf,
  IsIn,
} from 'class-validator';

export default class SendSupportEmailDto {
  @IsString()
  @MinLength(1, { message: 'Name is required' })
  @MaxLength(100, { message: 'Name cannot exceed 100 characters' })
  name!: string;

  @IsEmail({}, { message: 'Please provide a valid email address' })
  email!: string;

  @IsIn(['bug_report', 'feature_request', 'account_issue', 'other'], {
    message: 'Invalid subject',
  })
  subject!: string;

  @IsString()
  @MinLength(1, { message: 'Message is required' })
  @MaxLength(2000, { message: 'Message cannot exceed 2000 characters' })
  message!: string;

  @ValidateIf((o: SendSupportEmailDto) => o.subject === 'other', {
    message: 'Custom subject is required',
  })
  @IsString()
  @MinLength(1, { message: 'Custom subject is required' })
  @MaxLength(200, { message: 'Custom subject cannot exceed 200 characters' })
  customSubject?: string;
}
