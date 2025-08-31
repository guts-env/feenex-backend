export type AuthInput = {
  email: string;
  password: string;
};

export type AuthResponse = {
  accessToken: string;
  userId: string;
  email: string;
};
