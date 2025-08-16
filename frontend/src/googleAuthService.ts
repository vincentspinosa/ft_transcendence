import { GoogleCredentialResponse, GoogleSignInConfig, GoogleButtonConfig } from './authTypes';
import { parseJwt } from './jwtUtils';

/**
 * This file contains the `GoogleAuthService` class, a singleton-like
 * wrapper for managing Google Sign-In authentication within a web application.
 * It handles the lifecycle of the Google Identity Services library, including
 * initialization, button rendering, and credential response handling.
 */

// Extend the global Window interface to include Google Sign-In
declare global {
  /**
   * Augments the global `Window` interface to include the `google` object,
   * which is exposed by the Google Identity Services library script.
   * This is necessary for TypeScript to recognize the `window.google.accounts.id`
   * namespace without throwing a type error.
   */
  interface Window {
    google: {
      accounts: {
        id: {
          /**
           * Initializes the Google Identity Services library with the provided configuration.
           * @param config The configuration object for Google Sign-In.
           */
          initialize: (config: GoogleSignInConfig) => void;
          /**
           * Renders the Google Sign-In button within a specified HTML element.
           * @param element The DOM element where the button should be rendered.
           * @param config The configuration object for the button's appearance.
           */
          renderButton: (element: HTMLElement, config: GoogleButtonConfig) => void;
        };
      };
    };
  }
}

/**
 * A service class for handling Google Sign-In authentication.
 * It encapsulates the logic for initializing the Google library, rendering the sign-in button,
 * and processing the user's credential response.
 */
export class GoogleAuthService {
  /**
   * The Google API client ID for the application.
   * @private
   */
  private clientId: string;

  /**
   * A user-defined callback function to be executed with the user info upon successful sign-in.
   * @private
   */
  private callback: (userInfo: any) => void;

  /**
   * A flag to track whether the Google Sign-In library has been successfully initialized.
   * This prevents multiple initializations and ensures the button is rendered only after setup.
   * @private
   */
  private isInitialized: boolean = false;

  /**
   * Constructs a new `GoogleAuthService` instance.
   * @param clientId Your Google API client ID.
   * @param callback A function to be called with the parsed user information upon sign-in.
   */
  constructor(clientId: string, callback: (userInfo: any) => void) {
    this.clientId = clientId;
    this.callback = callback;
  }

  /**
   * Waits for the Google Identity Services library script to be loaded and available on the `window` object.
   * This is necessary because the script is typically loaded asynchronously.
   * @private
   * @returns A promise that resolves when the `window.google` object is available.
   */
  private waitForGoogle(): Promise<void> {
    return new Promise((resolve) => {
      // Check immediately if the library is already loaded.
      if (typeof window.google !== 'undefined') {
        resolve();
        return;
      }

      // If not loaded, set up an interval to check periodically.
      const checkInterval = setInterval(() => {
        if (typeof window.google !== 'undefined') {
          clearInterval(checkInterval);
          resolve();
        }
      }, 100);

      // Set a timeout to prevent the promise from hanging indefinitely if the library fails to load.
      setTimeout(() => {
        clearInterval(checkInterval);
        console.log('Google Sign-In library failed to load within 10 seconds. Check script inclusion.');
        resolve(); // Resolve anyway to prevent blocking, but with a warning.
      }, 10000);
    });
  }

  /**
   * Initializes the Google Sign-In client.
   * This method first waits for the Google library to load and then calls `google.accounts.id.initialize`.
   * @public
   * @async
   */
  public async initialize(): Promise<void> {
    console.log('GoogleAuthService: Waiting for Google library...');
    await this.waitForGoogle();

    // After waiting, re-check if the library is available.
    if (typeof window.google === 'undefined') {
      console.log('Google Sign-In library not loaded. Initialization aborted.');
      return;
    }

    console.log('GoogleAuthService: Google library loaded, initializing...');
    
    // Create the configuration object for the `initialize` method.
    const config: GoogleSignInConfig = {
      client_id: this.clientId,
      // Bind `this` to the callback to ensure it can access class properties.
      callback: this.handleCredentialResponse.bind(this),
      ux_mode: 'popup'
    };

    try {
      // Call the `initialize` method from the Google library.
      window.google.accounts.id.initialize(config);
      this.isInitialized = true;
      console.log('GoogleAuthService: Initialized successfully.');
    } catch (error) {
      console.log('GoogleAuthService: Failed to initialize:', error);
    }
  }

  /**
   * Renders the Google Sign-In button in a specified container element.
   * This method will automatically initialize the service if it hasn't been already.
   * @public
   * @async
   * @param containerElement The DOM element where the button will be inserted.
   */
  public async renderButton(containerElement: HTMLElement): Promise<void> {
    // If the service is not initialized, call the initialization method.
    if (!this.isInitialized) {
      console.log('GoogleAuthService: Waiting for initialization...');
      await this.initialize();
    }

    // Re-check for the library's availability before attempting to render.
    if (typeof window.google === 'undefined') {
      console.log('Google Sign-In library not loaded. Button rendering aborted.');
      return;
    }

    console.log('GoogleAuthService: Rendering button...');
    
    // Create the configuration object for the button's appearance.
    const buttonConfig: GoogleButtonConfig = {
      theme: 'filled_blue',
      size: 'large',
      text: 'signin_with',
      shape: 'rectangular',
      width: 250
    };

    try {
      // Call the `renderButton` method from the Google library.
      window.google.accounts.id.renderButton(containerElement, buttonConfig);
      console.log('GoogleAuthService: Button rendered successfully.');
    } catch (error) {
      console.log('GoogleAuthService: Failed to render button:', error);
    }
  }

  /**
   * Handles the credential response from the Google Sign-In process.
   * This private method is used as the callback for the `initialize` method.
   * It parses the ID token and invokes the user-provided callback with the user info.
   * @private
   * @param response The credential response object from Google.
   */
  private handleCredentialResponse(response: GoogleCredentialResponse): void {
    try {
      console.log('GoogleAuthService: Received credential response');
      console.log('ID token:', response.credential);

      // Use the utility function to parse the JWT and get the user's information.
      const userInfo = parseJwt(response.credential);
      
      // Call the developer's custom callback with the parsed user info.
      this.callback(userInfo);
    } catch (error) {
      console.log('Error handling credential response:', error);
    }
  }
}