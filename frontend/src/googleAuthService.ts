import { GoogleCredentialResponse, GoogleSignInConfig, GoogleButtonConfig } from './authTypes';
import { parseJwt } from './jwtUtils';

// Extend the global Window interface to include Google Sign-In
declare global {
  interface Window {
    google: {
      accounts: {
        id: {
          initialize: (config: GoogleSignInConfig) => void;
          renderButton: (element: HTMLElement, config: GoogleButtonConfig) => void;
        };
      };
    };
  }
}

export class GoogleAuthService {
  private clientId: string;
  private callback: (userInfo: any) => void;
  private isInitialized: boolean = false;

  constructor(clientId: string, callback: (userInfo: any) => void) {
    this.clientId = clientId;
    this.callback = callback;
  }

  /**
   * Wait for Google library to be available
   */
  private waitForGoogle(): Promise<void> {
    return new Promise((resolve) => {
      if (typeof window.google !== 'undefined') {
        resolve();
        return;
      }

      // Check every 100ms for Google library
      const checkInterval = setInterval(() => {
        if (typeof window.google !== 'undefined') {
          clearInterval(checkInterval);
          resolve();
        }
      }, 100);

      // Timeout after 10 seconds
      setTimeout(() => {
        clearInterval(checkInterval);
        console.log('Google Sign-In library failed to load within 10 seconds');
        resolve();
      }, 10000);
    });
  }

  /**
   * Initialize Google Sign-In
   */
  public async initialize(): Promise<void> {
    console.log('GoogleAuthService: Waiting for Google library...');
    await this.waitForGoogle();

    if (typeof window.google === 'undefined') {
      console.log('Google Sign-In library not loaded');
      return;
    }

    console.log('GoogleAuthService: Google library loaded, initializing...');
    const config: GoogleSignInConfig = {
      client_id: this.clientId,
      callback: this.handleCredentialResponse.bind(this),
      ux_mode: 'popup'
    };

    try {
      window.google.accounts.id.initialize(config);
      this.isInitialized = true;
      console.log('GoogleAuthService: Initialized successfully');
    } catch (error) {
      console.log('GoogleAuthService: Failed to initialize:', error);
    }
  }

  /**
   * Render the Google Sign-In button
   */
  public async renderButton(containerElement: HTMLElement): Promise<void> {
    if (!this.isInitialized) {
      console.log('GoogleAuthService: Waiting for initialization...');
      await this.initialize();
    }

    if (typeof window.google === 'undefined') {
      console.log('Google Sign-In library not loaded');
      return;
    }

    console.log('GoogleAuthService: Rendering button...');
    const buttonConfig: GoogleButtonConfig = {
      theme: 'filled_blue',
      size: 'large',
      text: 'signin_with',
      shape: 'rectangular',
      width: 250
    };

    try {
      window.google.accounts.id.renderButton(containerElement, buttonConfig);
      console.log('GoogleAuthService: Button rendered successfully');
    } catch (error) {
      console.log('GoogleAuthService: Failed to render button:', error);
    }
  }

  /**
   * Handle the credential response from Google Sign-In
   */
  private handleCredentialResponse(response: GoogleCredentialResponse): void {
    try {
      console.log('GoogleAuthService: Received credential response');
      console.log('ID token:', response.credential);

      // Parse the JWT token to get user information
      const userInfo = parseJwt(response.credential);
      
      // Call the callback with user information
      this.callback(userInfo);
    } catch (error) {
      console.log('Error handling credential response:', error);
    }
  }
}
