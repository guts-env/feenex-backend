/* AccountType should always be aligned with organization_type db enum */
export enum AccountTypeEnum {
  BUSINESS = 'business',
  PERSONAL = 'personal',
}

/* UserRole should always be aligned with available role names in db roles table */
export enum UserRoleEnum {
  PERSONAL_ADMIN = 'personal_admin',
  BUSINESS_ADMIN = 'business_admin',
  MEMBER = 'member',
}

/* PermissionResource should always be aligned with permission_resource db enum  */
export enum PermissionResourceEnum {
  CATEGORIES = 'categories',
  USERS = 'users',
  EXPENSES = 'expenses',
  ORGANIZATION = 'organizations',
}

/* PermissionAction should always be aligned with permission_action db enum  */
export enum PermissionActionEnum {
  CREATE = 'create',
  READ = 'read',
  UPDATE = 'update',
  DELETE = 'delete',
  MANAGE = 'manage',
}

/* ExpenseStatusEnum should always be aligned with expense_status db enum */
export enum ExpenseStatusEnum {
  DRAFT = 'draft',
  PENDING = 'pending',
  VERIFIED = 'verified',
  REJECTED = 'rejected',
}

/* ExpenseSourceEnum should always be aligned with expense_source db enum */
export enum ExpenseSourceEnum {
  MANUAL = 'manual',
  OCR = 'ocr',
  IMPORT = 'import',
  API = 'api',
}

/* CurrencyCodeEnum should always be aligned with currency_code db enum */
export enum CurrencyCodeEnum {
  PHP = 'PHP',
  USD = 'USD',
  HKD = 'HKD',
  THB = 'THB',
  VND = 'VND',
}

export enum FileUploadKeysEnum {
  RECEIPTS = 'receipts',
  IMPORTS = 'imports',
}

export enum SortOrderEnum {
  ASC = 'ASC',
  DESC = 'DESC',
}
