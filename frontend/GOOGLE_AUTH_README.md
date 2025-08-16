# Google Authentication Integration

This project now includes Google OAuth authentication that requires users to sign in before accessing the Pong game.

## Features

- **Mandatory Authentication**: Users must sign in with Google before accessing the app
- **Persistent Sessions**: User authentication persists across browser sessions using localStorage
- **User Profile Display**: Shows user's Google profile picture, name, and email in the main menu
- **Logout Functionality**: Users can log out and return to the login screen

## How It Works

1. **Initial Load**: The app starts with a login screen showing the Google Sign-In button
2. **Authentication**: Users click the Google Sign-In button and complete OAuth flow
3. **Main Menu**: After successful authentication, users see the main game menu with their profile info
4. **Game Access**: Users can now access all game modes (1v1, 2v2, Tournament)
5. **Logout**: Users can log out using the logout button below the main menu buttons

## Technical Implementation

### Files Added/Modified

- `src/authTypes.ts` - TypeScript interfaces for Google authentication
- `src/jwtUtils.ts` - JWT token parsing utilities
- `src/googleAuthService.ts` - Google Sign-In service implementation
- `src/main.ts` - Updated to integrate authentication flow
- `index.html` - Added login screen and user profile section
- `pong-wallpaper.webp` - Background image for login screen

### Authentication Flow

1. **Service Initialization**: GoogleAuthService is initialized with the client ID
2. **Button Rendering**: Google Sign-In button is rendered in the login screen
3. **OAuth Callback**: When user signs in, JWT token is parsed for user info
4. **Session Storage**: User data is stored in localStorage for persistence
5. **Navigation Control**: App prevents access to game screens without authentication
6. **Profile Display**: User profile is shown in the main menu with logout option

### Security Features

- **Session Persistence**: Maintains authentication across browser sessions
- **Clean Logout**: Properly clears user data and returns to login screen

## Configuration

The Google client ID is currently hardcoded in `main.ts`. In production, this should be:

1. **Environment Variable**: Stored in `.env` file
2. **Backend Configuration**: Managed through environment variables
3. **Secure Storage**: Not exposed in client-side code

## Usage

1. **Start the app**: Run `npm start` in the frontend directory
2. **Login**: Click the Google Sign-In button on the login screen
3. **Play**: Access game modes from the main menu
4. **Logout**: Use the logout button to sign out

## Browser Compatibility

- Modern browsers with ES6+ support
- Google Sign-In library compatibility
- LocalStorage support for session persistence

## Future Enhancements

- **Backend Integration**: Server-side token validation
- **User Management**: User accounts and game statistics
