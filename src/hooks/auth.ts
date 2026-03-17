import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import {
  login,
  signup,
  verifyEmail,
  requestPasswordReset,
  resetPassword,
  logout,
} from '@/lib/api/auth';
import type { APIError, User } from '@/types/auth';
import { setCookie, deleteCookie, getCookie } from 'cookies-next';
import { storeUserData, getUserDataFromStorage } from '@/lib/utils/token';
import { clearUserData } from '../lib/localStorageManager';

// Query keys for auth state
const authKeys = {
  user: ['user'] as const,
};

// Helper function to safely decode JWT
const decodeJWT = (token: string) => {
  try {
    console.log('Decoding JWT token:', token.substring(0, 20) + '...');

    const base64Url = token.split('.')[1];
    if (!base64Url) {
      console.error('Invalid token format - no payload section');
      return null;
    }

    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );

    const payload = JSON.parse(jsonPayload);
    console.log('Decoded JWT payload:', payload);

    return payload;
  } catch (error) {
    console.error('Error decoding JWT:', error);
    return null;
  }
};

// Hook to access the cached user data
export const useUser = () => {
  return useQuery({
    queryKey: authKeys.user,
    queryFn: () => {
      // First, try to get user data from local storage
      const storedUserData = getUserDataFromStorage();
      if (storedUserData) {
        console.log(
          'useUser hook - using user data from local storage:',
          storedUserData
        );
        return storedUserData;
      }

      // If not in local storage, try to get from token
      const accessToken = getCookie('accessToken');
      console.log('useUser hook - accessToken exists:', !!accessToken);

      if (!accessToken) return null;

      // Parse the JWT token to get user data
      try {
        const token = accessToken.toString();
        const payload = decodeJWT(token);
        console.log('useUser hook - JWT payload:', payload);

        if (!payload) return null;

        // Check if name exists in the payload
        if (!payload.name) {
          console.warn(
            'useUser hook - name not found in JWT payload:',
            payload
          );
        }

        // Check for different possible name fields in the token
        const userName =
          payload.name ||
          payload.username ||
          payload.given_name ||
          payload.preferred_username;

        if (!userName) {
          console.warn('No name field found in JWT payload:', payload);
        }

        // Map the payload to our User type
        const userData = {
          id: payload.sub || payload.id || payload.userId,
          email: payload.email,
          name: userName || 'User', // Ensure we always have a name
          emailVerified: payload.emailVerified || false,
          profilePhoto: payload.profilePhoto || null,
        } as User;

        console.log('useUser hook - mapped user data:', userData);

        // Store the user data in local storage for future use
        storeUserData(userData);

        return userData;
      } catch (error) {
        console.error('Error parsing user data from token:', error);
        return null;
      }
    },
    staleTime: Infinity, // Keep data fresh until explicitly invalidated
    gcTime: Infinity, // Don't garbage collect the user data
    refetchOnWindowFocus: false, // Don't refetch when window regains focus
    refetchOnMount: true, // Always refetch when component mounts to ensure we have the latest data
  });
};

export const useLogin = () => {
  const router = useRouter();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: login,
    onSuccess: (data) => {
      // Update the user data in the query cache
      queryClient.setQueryData(authKeys.user, data.user);

      // Store user data in local storage
      storeUserData(data.user);

      if (!data.user.emailVerified) {
        // Set verification pending state
        setCookie('verificationPending', 'true', { path: '/' });
        setCookie('verificationEmail', data.user.email, { path: '/' });
        router.push(
          `/verify-email?email=${encodeURIComponent(data.user.email)}`
        );
        return;
      }

      // Clear verification state if exists
      deleteCookie('verificationPending');
      deleteCookie('verificationEmail');

      // Redirect to dashboard
      router.push('/dashboard');
    },
    onError: (error: APIError) => {
      if (
        error.response?.status === 403 &&
        error.response?.data?.requiresVerification
      ) {
        const email = error.response.data.email;
        if (email) {
          // Set verification pending state
          setCookie('verificationPending', 'true', { path: '/' });
          setCookie('verificationEmail', email, { path: '/' });
          router.push(`/verify-email?email=${encodeURIComponent(email)}`);
        }
      }
    },
  });
};

export const useSignup = () => {
  const router = useRouter();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: signup,
    onSuccess: (data) => {
      console.log('Signup success, received data:', data);

      // Update the user data in the query cache
      queryClient.setQueryData(authKeys.user, data.user);

      // Store user data in local storage
      storeUserData(data.user);

      if (data.user?.email) {
        // Set verification pending state
        setCookie('verificationPending', 'true', { path: '/' });
        setCookie('verificationEmail', data.user.email, { path: '/' });
        router.push(
          `/verify-email?email=${encodeURIComponent(data.user.email)}`
        );
      }
    },
    onError: (error: APIError) => {
      console.error('Signup error in hook:', error);

      // If the error indicates email verification is needed
      if (
        error.response?.status === 403 &&
        error.response?.data?.requiresVerification
      ) {
        const email = error.response.data.email || '';
        if (email) {
          // Set verification pending state
          setCookie('verificationPending', 'true', { path: '/' });
          setCookie('verificationEmail', email, { path: '/' });
          router.push(`/verify-email?email=${encodeURIComponent(email)}`);
        }
      }

      // If the error is a network error, show a more specific message
      if (!error.response) {
        console.error('Network error during signup. Check server connection.');
      }
    },
  });
};

export const useVerifyEmail = () => {
  const router = useRouter();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: verifyEmail,
    onSuccess: (data) => {
      // Update the user data in the query cache
      queryClient.setQueryData(authKeys.user, data.user);

      // Store user data in local storage
      storeUserData(data.user);

      // Clear verification state
      deleteCookie('verificationPending');
      deleteCookie('verificationEmail');

      // Use router.push instead of window.location.href
      router.push('/dashboard');
    },
  });
};

export const useRequestPasswordReset = () => {
  const router = useRouter();

  return useMutation({
    mutationFn: requestPasswordReset,
    onSuccess: (data, variables) => {
      if (data.success) {
        // Pass the email as a query parameter
        router.push(
          `/reset-password?email=${encodeURIComponent(variables.email)}`
        );
      } else {
        console.error('Failed to send reset link:', data.message);
      }
    },
    onError: (error) => {
      console.error('Error sending reset link:', error);
    },
  });
};

export const useResetPassword = () => {
  const router = useRouter();

  return useMutation({
    mutationFn: resetPassword,
    onSuccess: () => {
      router.push('/login');
    },
  });
};

export const useLogout = () => {
  const router = useRouter();
  const queryClient = useQueryClient();

  return () => {
    logout();
    // Clear the user data from the query cache
    queryClient.setQueryData(authKeys.user, null);
    // Remove all queries from cache
    queryClient.clear();

    // Clear user data from local storage
    clearUserData();

    router.push('/login');
  };
};
