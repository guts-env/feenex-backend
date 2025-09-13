import { FileUploadKeysEnum } from './enums';

export const ALLOWED_IMAGE_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/heic',
  'image/heif',
  'application/pdf',
] as const;

export const ALLOWED_DOCUMENT_TYPES = [
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'text/csv',
] as const;

export const ALLOWED_CONTENT_TYPES = [
  ...ALLOWED_IMAGE_TYPES,
  ...ALLOWED_DOCUMENT_TYPES,
] as const;

export const FILE_SIZE_LIMITS = {
  [FileUploadKeysEnum.RECEIPTS]: 5 * 1024 * 1024,
  [FileUploadKeysEnum.IMPORTS]: 15 * 1024 * 1024,
} as const;
