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

export enum FileUploadKeysEnum {
  RECEIPTS = 'receipts',
  IMPORTS = 'imports',
}
