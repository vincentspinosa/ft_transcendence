import { GoogleUserInfo } from './authTypes';

/**
 * Parse a JWT token and return the payload
 * Note: This is for demo purposes only. In production, verify tokens on the server side.
 */
export function parseJwt(token: string): GoogleUserInfo {
  try {
    // Split the JWT and get the payload part
    const base64Url = token.split('.')[1];
    if (!base64Url) {
      throw new Error('Invalid JWT format');
    }

    // Replace URL-specific characters for standard base64
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    
    // Decode base64 string to JSON
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    
    return JSON.parse(jsonPayload);
  } catch (error) {
    console.error('Error parsing JWT:', error);
    throw new Error('Failed to parse JWT token');
  }
}
