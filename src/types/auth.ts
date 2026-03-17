export interface User {
  id: string;
  name: string;
  email: string;
  profilePhoto: string | null;
  emailVerified: boolean;
}

export interface AuthResponse {
  message: string;
  user: User;
  accessToken: string;
  refreshToken: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface SignupRequest {
  name: string;
  email: string;
  password: string;
}

export interface VerifyEmailRequest {
  email: string;
  otp: string;
}

export interface RequestPasswordResetRequest {
  email: string;
}

export interface ResetPasswordRequest {
  email: string;
  otp: string;
  newPassword: string;
}

export interface ErrorResponse {
  message: string;
  requiresVerification?: boolean;
  email?: string;
}

export interface APIError extends Error {
  response?: {
    data?: ErrorResponse;
    status?: number;
  };
}
