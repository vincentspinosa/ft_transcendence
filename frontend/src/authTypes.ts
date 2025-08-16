// Google Sign-In types
export interface GoogleCredentialResponse {
  credential: string;
  select_by: string;
}

export interface GoogleUserInfo {
  iss: string;
  azp: string;
  aud: string;
  sub: string;
  email: string;
  email_verified: boolean;
  at_hash: string;
  name: string;
  picture: string;
  given_name: string;
  family_name: string;
  locale: string;
  iat: number;
  exp: number;
}

// Google Sign-In configuration
export interface GoogleSignInConfig {
  client_id: string;
  callback: (response: GoogleCredentialResponse) => void;
  ux_mode: 'popup' | 'redirect';
}

// Button configuration
export interface GoogleButtonConfig {
  theme: 'outline' | 'filled_blue' | 'filled_black' | 'filled_white';
  size: 'large' | 'medium' | 'small';
  text: 'signin_with' | 'signup_with' | 'continue_with' | 'signin';
  shape: 'rectangular' | 'pill' | 'circle' | 'square';
  width?: number;
}
