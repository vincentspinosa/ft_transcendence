// Google Sign-In types

/**
 * @file This file contains TypeScript interfaces for Google Sign-In,
 * providing type definitions for the data structures used in the authentication process.
 */

/**
 * Interface representing the response object received from the Google Sign-In flow.
 * This object contains the user's credential (ID token) and a description of how it was obtained.
 */
export interface GoogleCredentialResponse {
  /**
   * The JSON Web Token (JWT) string containing the user's ID token.
   * This token can be decoded on the client or verified on the server to retrieve
   * user information like email, name, and profile picture.
   */
  credential: string;

  /**
   * A string indicating how the credential was selected by the user.
   * Possible values include:
   * - 'auto': The credential was selected automatically by the browser.
   * - 'user': The user explicitly selected the credential.
   * - 'unverfied_user': The user selected a credential that is not verified.
   * - 'unverfied_session': The credential was selected from an unverified session.
   * - 'one_tap': The user signed in using the One Tap UI.
   */
  select_by: string;
}

/**
 * Interface representing the decoded payload of a Google ID token.
 * This contains the user's profile information and other details about the token.
 */
export interface GoogleUserInfo {
  /**
   * The issuer of the token. For Google ID tokens, this will be 'https://accounts.google.com'.
   */
  iss: string;

  /**
   * The audience for whom this token is intended.
   * This should be the same as the `client_id` of your application.
   */
  aud: string;

  /**
   * The `sub` (subject) of the token, which is the unique user ID.
   * This is a stable identifier for the user across your application and Google's ecosystem.
   */
  sub: string;

  /**
   * The user's email address.
   */
  email: string;

  /**
   * A boolean indicating if the email address has been verified by Google.
   */
  email_verified: boolean;

  /**
   * The user's full name.
   */
  name: string;

  /**
   * The URL of the user's profile picture.
   */
  picture: string;

  /**
   * The user's given name (first name).
   */
  given_name: string;

  /**
   * The user's family name (last name).
   */
  family_name: string;

  /**
   * The user's locale (language and country), e.g., 'en-US'.
   */
  locale: string;

  /**
   * The timestamp of when the JWT was issued, represented in seconds since the Unix epoch.
   */
  iat: number;

  /**
   * The timestamp of when the JWT expires, represented in seconds since the Unix epoch.
   */
  exp: number;

  /**
   * The `azp` (authorized party) property.
   * This is the `client_id` of the client that the user authorized.
   * It's a good practice to verify that this matches your application's `client_id`.
   */
  azp: string;

  /**
   * The `at_hash` (access token hash) property.
   * This is a hash of the access token, used to link the ID token with an access token.
   */
  at_hash: string;
}

// Google Sign-In configuration

/**
 * Interface for configuring the Google Sign-In client.
 * This object is used to initialize the Google Identity Services library.
 */
export interface GoogleSignInConfig {
  /**
   * Your unique Google API client ID.
   * This is obtained from the Google Cloud Console and is required for authentication.
   */
  client_id: string;

  /**
   * A callback function that is invoked when the user successfully signs in.
   * The function receives the `GoogleCredentialResponse` object as its argument.
   */
  callback: (response: GoogleCredentialResponse) => void;

  /**
   * The user experience mode for the sign-in flow.
   * - 'popup': The sign-in flow opens in a pop-up window.
   * - 'redirect': The user is redirected to a new page to complete the sign-in.
   */
  ux_mode: 'popup' | 'redirect';
}

// Button configuration

/**
 * Interface for configuring the visual appearance of the Google Sign-In button.
 * These options are used to customize the button's theme, size, text, and shape.
 */
export interface GoogleButtonConfig {
  /**
   * The visual theme of the button.
   * - 'outline': A button with a border and no fill.
   * - 'filled_blue': A solid blue button.
   * - 'filled_black': A solid black button.
   * - 'filled_white': A solid white button.
   */
  theme: 'outline' | 'filled_blue' | 'filled_black' | 'filled_white';

  /**
   * The size of the button.
   */
  size: 'large' | 'medium' | 'small';

  /**
   * The text displayed on the button.
   */
  text: 'signin_with' | 'signup_with' | 'continue_with' | 'signin';

  /**
   * The shape of the button.
   * - 'rectangular': A standard rectangular button.
   * - 'pill': A button with rounded ends.
   * - 'circle': A circular button (typically for a single icon).
   * - 'square': A square button.
   */
  shape: 'rectangular' | 'pill' | 'circle' | 'square';

  /**
   * An optional fixed width for the button, in pixels.
   * If not provided, the button's width will be determined by its content.
   */
  width?: number;
}