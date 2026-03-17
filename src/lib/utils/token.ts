import { getCookie } from 'cookies-next';
import { getItem, setItem } from '../localStorageManager';
import * as keys from '../localStorageKeys';

interface UserData {
  [key: string]: unknown;
}

/**
 * Stores user data in local storage
 * @param userData The user data to store
 */
export function storeUserData(userData: UserData) {
  if (typeof window !== 'undefined' && userData) {
    try {
      setItem(keys.USER_DATA, userData);
      console.log('User data stored in local storage:', userData);
    } catch (error) {
      console.error('Error storing user data in local storage:', error);
    }
  }
}

/**
 * Retrieves user data from local storage
 * @returns The user data from local storage, or null if not found
 */
export function getUserDataFromStorage() {
  if (typeof window !== 'undefined') {
    try {
      const userData = getItem(keys.USER_DATA);
      if (userData) {
        return userData;
      }
    } catch (error) {
      console.error('Error retrieving user data from local storage:', error);
    }
  }
  return null;
}

/**
 * Extracts user information from the JWT token
 * @returns An object with user information from the token, or null if no token is found
 */
export function getUserFromToken() {
  try {
    const token = getCookie('accessToken');
    if (!token) {
      console.log('No access token found');
      return null;
    }

    const base64Url = token.toString().split('.')[1];
    if (!base64Url) {
      console.log('Invalid token format - no payload section');
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
    console.log('Token payload:', payload);

    // Check for different possible name fields in the token
    if (payload.name) {
      console.log('Found name in token:', payload.name);
    } else if (payload.username) {
      console.log('Found username in token:', payload.username);
    } else if (payload.given_name) {
      console.log('Found given_name in token:', payload.given_name);
    } else if (payload.preferred_username) {
      console.log(
        'Found preferred_username in token:',
        payload.preferred_username
      );
    } else {
      console.log('No name field found in token');
    }

    return payload;
  } catch (error) {
    console.error('Error extracting user from token:', error);
    return null;
  }
}

/**
 * Gets the user's name from the JWT token
 * @param defaultName Default name to return if no name is found in the token
 * @returns The user's name from the token, or the default name if not found
 */
export function getUserNameFromToken(defaultName = 'User') {
  const payload = getUserFromToken();
  if (!payload) return defaultName;

  // Check for different possible name fields in the token
  const userName =
    payload.name ||
    payload.username ||
    payload.given_name ||
    payload.preferred_username;

  // Return default name if no name field is found
  return userName || defaultName;
}

/**
 * Generates user initials from a name
 * @param name The name to generate initials from
 * @param maxLength Maximum length of the initials (default: 2)
 * @returns The user's initials
 */
export function generateUserInitials(name: string, maxLength = 2) {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .substring(0, maxLength);
}
