import { FileUploadKeysEnum } from '@/common/constants/enums';
import {
  ALLOWED_DOCUMENT_TYPES,
  ALLOWED_IMAGE_TYPES,
  FILE_SIZE_LIMITS,
} from '@/common/constants/upload';
import {
  IsEnum,
  IsNotEmpty,
  IsString,
  MaxLength,
  registerDecorator,
  ValidateIf,
  ValidationOptions,
  ValidationArguments,
  IsNumber,
  IsPositive,
} from 'class-validator';
import { type IAllowedContentTypes } from '@/common/types/common';
import { Expose } from 'class-transformer';

function IsContentTypeValid(validationOptions?: ValidationOptions) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      name: 'IsContentTypeValid',
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      validator: {
        validate(contentType: string, args: ValidationArguments) {
          const object = args.object as PresignedUploadDto;
          const key = object.key;

          if (!key || !contentType) {
            return false;
          }

          switch (key) {
            case FileUploadKeysEnum.RECEIPTS:
              return (ALLOWED_IMAGE_TYPES as readonly string[]).includes(
                contentType,
              );
            case FileUploadKeysEnum.IMPORTS:
              return (ALLOWED_DOCUMENT_TYPES as readonly string[]).includes(
                contentType,
              );
            default:
              return false;
          }
        },
        defaultMessage(args: ValidationArguments) {
          const object = args.object as PresignedUploadDto;
          const key = object.key;

          switch (key) {
            case FileUploadKeysEnum.RECEIPTS:
              return 'Receipt files must be images or PDF';
            case FileUploadKeysEnum.IMPORTS:
              return 'Import files must be CSV or Excel';
            default:
              return 'Invalid content type for the specified upload key';
          }
        },
      },
    });
  };
}

function IsFileSizeValid(validationOptions?: ValidationOptions) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      name: 'IsFileSizeValid',
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      validator: {
        validate(filesize: number, args: ValidationArguments) {
          const object = args.object as PresignedUploadDto;
          const key = object.key;

          if (!key || !filesize) {
            return false;
          }

          const maxSize = FILE_SIZE_LIMITS[key];

          return filesize > 0 && filesize <= maxSize;
        },
        defaultMessage(args: ValidationArguments) {
          const object = args.object as PresignedUploadDto;
          const key = object.key;

          if (!key) {
            return 'Upload key is required to validate file size';
          }

          const maxSize = FILE_SIZE_LIMITS[key];
          const maxSizeMB = Math.round(maxSize / (1024 * 1024));

          switch (key) {
            case FileUploadKeysEnum.RECEIPTS:
              return `Receipt files must be smaller than ${maxSizeMB}MB`;
            case FileUploadKeysEnum.IMPORTS:
              return `Import files must be smaller than ${maxSizeMB}MB`;
            default:
              return `File size exceeds the limit of ${maxSizeMB}MB`;
          }
        },
      },
    });
  };
}

export default class PresignedUploadDto {
  @IsString()
  @MaxLength(255, { message: 'Filename must be less than 255 characters' })
  @IsNotEmpty({ message: 'Filename is required' })
  filename!: string;

  @IsEnum(FileUploadKeysEnum, {
    message: 'Invalid upload key',
  })
  @IsNotEmpty({ message: 'Upload key is required' })
  key!: FileUploadKeysEnum;

  @ValidateIf((o: PresignedUploadDto) =>
    Object.values(FileUploadKeysEnum).includes(o.key),
  )
  @IsContentTypeValid()
  @IsNotEmpty({ message: 'Content type is required' })
  contentType!: IAllowedContentTypes;

  @IsNumber({}, { message: 'File size must be a number' })
  @IsPositive({ message: 'Invalid file size' })
  @IsFileSizeValid()
  filesize!: number;
}

export class PresignedUploadResDto {
  @Expose()
  key!: string;

  @Expose()
  url!: string;
}
