import { GoogleUserInfo } from './authTypes';

/**
 * @file This file contains a utility function for parsing a JSON Web Token (JWT),
 * specifically designed to extract the payload from a Google ID token.
 */

/**
 * Parses a JWT token and returns the payload as a `GoogleUserInfo` object.
 * This function performs a client-side decoding of the token's payload.
 *
 * @param token The JWT token string to be parsed, typically a Google ID token.
 * @returns The decoded payload of the JWT as a `GoogleUserInfo` object.
 * @throws {Error} Throws an error if the token format is invalid or if parsing fails.
 */
export function parseJwt(token: string): GoogleUserInfo {
  try {
    /**
     * A JWT consists of three parts separated by dots:
     * 1. Header
     * 2. Payload
     * 3. Signature
     * We are interested in the second part, the payload.
     */
    const base64Url = token.split('.')[1];
    
    // Check if the payload part exists in the token string.
    if (!base64Url) {
      throw new Error('Invalid JWT format: The token does not have a valid payload part.');
    }

    // Replace URL-safe characters ('-' and '_') with standard Base64 characters ('+' and '/')
    // as the payload is Base64Url-encoded.
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    
    /**
     * Decode the Base64 string to its original character sequence.
     * `atob()` is a browser API function for Base64 decoding.
     * The `decodeURIComponent()` and `map()` part is a common method to handle
     * UTF-8 characters correctly after `atob()` has decoded the Base64.
     * This ensures that multi-byte characters (like those in non-English names)
     * are correctly interpreted.
     */
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    
    // Parse the JSON string to a JavaScript object.
    return JSON.parse(jsonPayload);
  } catch (error) {
    // Log the error for debugging purposes and re-throw a more generic error.
    console.log('Error parsing JWT:', error);
    throw new Error('Failed to parse JWT token. Check if the token is valid and not malformed.');
  }
}