import { axiosInstance } from '../axios';
import {
  AuthResponse,
  LoginRequest,
  SignupRequest,
  VerifyEmailRequest,
  RequestPasswordResetRequest,
  ResetPasswordRequest,
  APIError,
} from '@/types/auth';
import { setCookie, deleteCookie } from 'cookies-next';
import { toast } from 'sonner';

const COOKIE_OPTIONS = {
  path: '/',
  secure: false, // Changed from process.env.NODE_ENV === 'production' to false for HTTP support
  sameSite: 'lax' as const,
};

export const login = async (data: LoginRequest): Promise<AuthResponse> => {
  try {
    console.log('Attempting login with:', { email: data.email });

    const response = await axiosInstance.post<AuthResponse>(
      '/auth/login',
      data
    );

    console.log('Login response:', response.data);

    // Debug: Check if user data is present in the response
    if (response.data.user) {
      console.log('User data in login response:', response.data.user);
      console.log('User name in login response:', response.data.user.name);
    } else {
      console.warn('No user data in login response!');
    }

    // Debug: Check token structure
    if (response.data.accessToken) {
      try {
        const token = response.data.accessToken;
        const base64Url = token.split('.')[1];
        if (base64Url) {
          const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
          const jsonPayload = decodeURIComponent(
            atob(base64)
              .split('')
              .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
              .join('')
          );
          const payload = JSON.parse(jsonPayload);
          console.log('Token payload in login response:', payload);
        }
      } catch (error) {
        console.error('Error parsing token in login response:', error);
      }

      setCookie('accessToken', response.data.accessToken, COOKIE_OPTIONS);
    } else {
      console.warn('No access token in login response!');
    }

    if (response.data.refreshToken) {
      setCookie('refreshToken', response.data.refreshToken, COOKIE_OPTIONS);
    } else {
      console.warn('No refresh token in login response!');
    }

    toast.success('Login successful! Redirecting...', {
      duration: 2000,
    });

    return response.data;
  } catch (error) {
    console.error('Login error:', error);
    const apiError = error as APIError;

    // If it's a 403 with requiresVerification, include the email in the error
    if (
      apiError.response?.status === 403 &&
      apiError.response?.data?.requiresVerification
    ) {
      apiError.response.data.email = data.email; // Include the email in the error response
      const errorMessage =
        apiError.response?.data?.message ||
        'Please verify your email to continue';
      toast.error(errorMessage, {
        duration: 3000,
      });
      throw apiError;
    }

    // Handle other errors
    const errorMessage =
      apiError.response?.data?.message || 'An error occurred during login';
    toast.error(errorMessage, {
      duration: 3000,
    });
    throw apiError;
  }
};

export const signup = async (data: SignupRequest): Promise<AuthResponse> => {
  try {
    console.log('Attempting signup with:', {
      email: data.email,
      name: data.name,
    });

    // Log the full request data for debugging
    console.log('Full signup request data:', data);

    const response = await axiosInstance.post<AuthResponse>(
      '/auth/signup',
      data
    );

    console.log('Signup response:', response.data);

    // Store tokens if they're returned (some APIs might return tokens even before verification)
    if (response.data.accessToken) {
      setCookie('accessToken', response.data.accessToken, COOKIE_OPTIONS);
    }

    if (response.data.refreshToken) {
      setCookie('refreshToken', response.data.refreshToken, COOKIE_OPTIONS);
    }

    // Set verification pending state if email verification is required
    if (response.data.user && !response.data.user.emailVerified) {
      setCookie('verificationPending', 'true', { path: '/' });
      setCookie('verificationEmail', response.data.user.email, { path: '/' });
    }

    toast.success('Account created successfully! Please verify your email.', {
      duration: 3000,
    });

    return response.data;
  } catch (error) {
    console.error('Signup error:', error);
    const apiError = error as APIError;

    // Handle specific error cases
    if (apiError.response?.status === 400) {
      // Bad request - likely validation error or email already exists
      const errorMessage =
        apiError.response?.data?.message ||
        'Invalid signup data. Please check your information.';
      toast.error(errorMessage, {
        duration: 3000,
      });
    } else if (apiError.response?.status === 409) {
      // Conflict - email already exists
      toast.error('An account with this email already exists.', {
        duration: 3000,
      });
    } else if (!apiError.response) {
      // Network error
      toast.error(
        'Network error. Please check your connection and try again.',
        {
          duration: 3000,
        }
      );
    } else {
      // Generic error
      const errorMessage =
        apiError.response?.data?.message || 'An error occurred during signup';
      toast.error(errorMessage, {
        duration: 3000,
      });
    }

    throw apiError;
  }
};

export const verifyEmail = async (
  data: VerifyEmailRequest
): Promise<AuthResponse> => {
  try {
    console.log('Attempting to verify email with:', data);

    const response = await axiosInstance.post<AuthResponse>(
      '/auth/verify-email',
      data
    );

    console.log('Verify email response:', response.data);

    // Store tokens if they're returned
    if (response.data.accessToken) {
      setCookie('accessToken', response.data.accessToken, COOKIE_OPTIONS);
    }

    if (response.data.refreshToken) {
      setCookie('refreshToken', response.data.refreshToken, COOKIE_OPTIONS);
    }

    toast.success('Email verified successfully! Redirecting...', {
      duration: 2000,
    });

    return response.data;
  } catch (error) {
    console.error('Email verification error:', error);
    const apiError = error as APIError;
    const errorMessage =
      apiError.response?.data?.message ||
      'An error occurred during email verification';
    toast.error(errorMessage, {
      duration: 3000,
    });
    throw apiError;
  }
};

export const requestPasswordReset = async (
  data: RequestPasswordResetRequest
): Promise<{ success: boolean; message: string }> => {
  try {
    const response = await axiosInstance.post<{
      success: boolean;
      message: string;
    }>('/auth/request-password-reset', data);
    console.log('Response from requestPasswordReset API:', response.data);
    toast.success('Password reset instructions sent to your email!', {
      duration: 3000,
    });
    return response.data;
  } catch (error) {
    const apiError = error as APIError;
    const errorMessage =
      apiError.response?.data?.message ||
      'An error occurred while requesting password reset';
    console.error('Error in requestPasswordReset:', errorMessage);
    toast.error(errorMessage, {
      duration: 3000,
    });
    throw apiError;
  }
};

export const resetPassword = async (
  data: ResetPasswordRequest
): Promise<{ message: string }> => {
  try {
    const response = await axiosInstance.post<{ message: string }>(
      '/auth/reset-password',
      data
    );
    toast.success('Password reset successful! You can now login.', {
      duration: 3000,
    });
    return response.data;
  } catch (error) {
    const apiError = error as APIError;
    const errorMessage =
      apiError.response?.data?.message ||
      'An error occurred while resetting password';
    toast.error(errorMessage, {
      duration: 3000,
    });
    throw apiError;
  }
};

export const logout = () => {
  try {
    deleteCookie('accessToken', COOKIE_OPTIONS);
    deleteCookie('refreshToken', COOKIE_OPTIONS);
    toast.success('Logged out successfully!', {
      duration: 2000,
    });
  } catch {
    toast.error('Error occurred during logout', {
      duration: 3000,
    });
  }
};
