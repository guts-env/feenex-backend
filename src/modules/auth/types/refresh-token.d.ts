export interface IRefreshTokenPayload {
  userId: string;
  tokenId: string;
  createdAt: number;
}

export interface IStoredRefreshToken extends IRefreshTokenPayload {
  hashedToken: string;
}
