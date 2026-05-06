export interface LoginRequest {
  email: string;
  password: string;
}

export interface AuthResponse {
  token?: string;
  accessToken?: string;
  refreshToken?: string;
  userId?: string;
  role?: string;
}

export interface CurrentUser {
  id: string;
  email: string;
  role: string;
}
