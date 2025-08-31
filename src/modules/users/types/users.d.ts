export interface BaseUser {
  email: string;
  password: string;
}

export interface User extends BaseUser {
  id: string;
  firstName?: string;
  middleName?: string;
  lastName?: string;
  createdAt: Date;
  updatedAt: Date;
}
