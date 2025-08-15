/**
 * Transcendence Backend Validation Module
 * 
 * This module provides comprehensive input validation for the Transcendence game backend.
 * It includes validation functions, custom error classes, and Fastify schemas for
 * ensuring data integrity and security across all game-related endpoints.
 * 
 * Features:
 * - Input validation for player names, colors, types, and game settings
 * - Custom validation error class with field-specific error information
 * - Validation constants for consistent limits across the application
 * - Fastify JSON schemas for automatic request validation
 * - Support for 1v1, 2v2, and tournament game modes
 * - Security validation (XSS prevention, input sanitization)
 * - Comprehensive validation for all game configuration options
 * 
 * @author Vincent Spinosa
 * @version 1.0.0
 */

// Import Fastify schema types for request validation
import { FastifySchema } from 'fastify';

/**
 * Validation Constants
 * 
 * These constants define the limits and valid values for various game parameters.
 * They ensure consistency across the application and make it easy to modify
 * validation rules in one central location.
 */
export const VALIDATION_CONSTANTS = {
  MAX_NAME_LENGTH: 20,                    // Maximum length for player names
  MIN_SCORE_LIMIT: 1,                     // Minimum score limit for games
  MAX_SCORE_LIMIT: 21,                    // Maximum score limit for games
  VALID_COLORS: ['white', 'lightblue', 'red', 'lightgreen'],  // Available player colors
  VALID_PLAYER_TYPES: ['human', 'ai']     // Available player types
} as const;

/**
 * Type Definitions
 * 
 * These interfaces define the structure of game configuration objects.
 * They ensure type safety and provide clear documentation of expected data formats.
 */

/**
 * Player Configuration Interface
 * 
 * Defines the structure for individual player settings including name, color, and type.
 * Used in all game modes (1v1, 2v2, tournament).
 */
export interface PlayerConfig {
  name: string;                    // Player's display name
  color: string;                   // Player's color in the game
  type: 'human' | 'ai';           // Whether the player is human or AI-controlled
}

/**
 * Game Settings Interface for 1v1 Mode
 * 
 * Defines the structure for two-player game configuration.
 * Includes both players' settings and game-wide options.
 */
export interface GameSettings {
  player1: PlayerConfig;          // First player configuration
  player2: PlayerConfig;          // Second player configuration
  scoreLimit: number;             // Score required to win the game
  enablePowerUps: boolean;        // Whether power-ups are enabled
}

/**
 * Four Player Game Settings Interface for 2v2 Mode
 * 
 * Defines the structure for four-player team game configuration.
 * Includes all four players' settings and game-wide options.
 */
export interface FourPlayerGameSettings {
  player1: PlayerConfig;          // First player configuration
  player2: PlayerConfig;          // Second player configuration
  player3: PlayerConfig;          // Third player configuration
  player4: PlayerConfig;          // Fourth player configuration
  scoreLimit: number;             // Score required to win the game
  enablePowerUps: boolean;        // Whether power-ups are enabled
}

/**
 * Tournament Settings Interface
 * 
 * Defines the structure for tournament game configuration.
 * Similar to four-player settings but specifically for tournament mode.
 */
export interface TournamentSettings {
  player1: PlayerConfig;          // First player configuration
  player2: PlayerConfig;          // Second player configuration
  player3: PlayerConfig;          // Third player configuration
  player4: PlayerConfig;          // Fourth player configuration
  scoreLimit: number;             // Score required to win the game
  enablePowerUps: boolean;        // Whether power-ups are enabled
}

/**
 * Validation Functions
 * 
 * These functions perform specific validation checks on different aspects
 * of game configuration. Each function throws a ValidationError if validation fails.
 */

/**
 * Custom Validation Error Class
 * 
 * Extends the base Error class to provide field-specific error information.
 * This allows the API to return detailed error messages indicating which
 * field failed validation and why.
 * 
 * @extends Error
 */
export class ValidationError extends Error {
  constructor(message: string, public field?: string) {
    super(message);
    this.name = 'ValidationError';  // Set error name for identification
  }
}

/**
 * Validate Player Name
 * 
 * Ensures player names meet the application's requirements for length,
 * content, and security. Prevents XSS attacks and ensures names are
 * appropriate for display.
 * 
 * @param name - The player name to validate
 * @param playerLabel - Human-readable label for the player (e.g., "Player 1")
 * @throws ValidationError if the name is invalid
 */
export function validatePlayerName(name: string, playerLabel: string): void {
  // Check if name is empty or only whitespace
  if (!name || name.trim().length === 0) {
    throw new ValidationError(`${playerLabel} name cannot be empty`, 'name');
  }
  
  // Check if name exceeds maximum length
  if (name.length > VALIDATION_CONSTANTS.MAX_NAME_LENGTH) {
    throw new ValidationError(
      `${playerLabel} name cannot exceed ${VALIDATION_CONSTANTS.MAX_NAME_LENGTH} characters`,
      'name'
    );
  }
  
  // Security check: Prevent potentially dangerous characters that could be used for XSS
  // This includes HTML tags, quotes, and ampersands that could break HTML/XML
  if (/[<>\"'&]/.test(name)) {
    throw new ValidationError(`${playerLabel} name contains invalid characters`, 'name');
  }
}

/**
 * Validate Player Color
 * 
 * Ensures player colors are from the predefined list of valid colors.
 * This prevents invalid color values and ensures consistent game appearance.
 * 
 * @param color - The color string to validate
 * @param playerLabel - Human-readable label for the player
 * @throws ValidationError if the color is invalid
 */
export function validatePlayerColor(color: string, playerLabel: string): void {
  if (!VALIDATION_CONSTANTS.VALID_COLORS.includes(color as any)) {
    throw new ValidationError(
      `${playerLabel} color must be one of: ${VALIDATION_CONSTANTS.VALID_COLORS.join(', ')}`,
      'color'
    );
  }
}

/**
 * Validate Player Type
 * 
 * Ensures player types are either 'human' or 'ai'.
 * This prevents invalid player type values and ensures proper game logic.
 * 
 * @param type - The player type string to validate
 * @param playerLabel - Human-readable label for the player
 * @throws ValidationError if the player type is invalid
 */
export function validatePlayerType(type: string, playerLabel: string): void {
  if (!VALIDATION_CONSTANTS.VALID_PLAYER_TYPES.includes(type as any)) {
    throw new ValidationError(
      `${playerLabel} type must be one of: ${VALIDATION_CONSTANTS.VALID_PLAYER_TYPES.join(', ')}`,
      'type'
    );
  }
}

/**
 * Validate Score Limit
 * 
 * Ensures score limits are within the acceptable range and are integers.
 * This prevents invalid game configurations and ensures games have reasonable lengths.
 * 
 * @param scoreLimit - The score limit number to validate
 * @param fieldName - The name of the field being validated (for error messages)
 * @throws ValidationError if the score limit is invalid
 */
export function validateScoreLimit(scoreLimit: number, fieldName: string = 'scoreLimit'): void {
  // Ensure score limit is an integer (not a decimal)
  if (!Number.isInteger(scoreLimit)) {
    throw new ValidationError(`${fieldName} must be an integer`, fieldName);
  }
  
  // Ensure score limit is within acceptable range
  if (scoreLimit < VALIDATION_CONSTANTS.MIN_SCORE_LIMIT || scoreLimit > VALIDATION_CONSTANTS.MAX_SCORE_LIMIT) {
    throw new ValidationError(
      `${fieldName} must be between ${VALIDATION_CONSTANTS.MIN_SCORE_LIMIT} and ${VALIDATION_CONSTANTS.MAX_SCORE_LIMIT}`,
      fieldName
    );
  }
}

/**
 * Validate Unique Player Names
 * 
 * Ensures all players in a game have unique names.
 * This prevents confusion during gameplay and ensures proper player identification.
 * 
 * @param players - Array of player configurations to validate
 * @param context - Human-readable context for error messages (e.g., "1v1 match")
 * @throws ValidationError if any player names are duplicated
 */
export function validateUniqueNames(players: PlayerConfig[], context: string): void {
  // Extract names and normalize them (trim whitespace, convert to lowercase)
  const names = players.map(p => p.name.trim().toLowerCase());
  const uniqueNames = new Set(names);
  
  // Check if the number of unique names matches the total number of names
  if (names.length !== uniqueNames.size) {
    throw new ValidationError(`All player names must be unique in ${context}`, 'names');
  }
}

/**
 * Validate 1v1 Game Settings
 * 
 * Performs comprehensive validation of all aspects of a 1v1 game configuration.
 * This includes individual player validation and game-wide settings validation.
 * 
 * @param settings - The game settings object to validate
 * @throws ValidationError if any validation fails
 */
export function validateGameSettings(settings: GameSettings): void {
  // Validate first player's configuration
  validatePlayerName(settings.player1.name, 'Player 1');
  validatePlayerColor(settings.player1.color, 'Player 1');
  validatePlayerType(settings.player1.type, 'Player 1');
  
  // Validate second player's configuration
  validatePlayerName(settings.player2.name, 'Player 2');
  validatePlayerColor(settings.player2.color, 'Player 2');
  validatePlayerType(settings.player2.type, 'Player 2');
  
  // Validate game-wide settings
  validateScoreLimit(settings.scoreLimit);
  
  // Ensure player names are unique
  validateUniqueNames([settings.player1, settings.player2], '1v1 match');
  
  // Note: enablePowerUps is a boolean and is automatically validated by JSON schema
}

/**
 * Validate 2v2 Game Settings
 * 
 * Performs comprehensive validation of all aspects of a 2v2 game configuration.
 * This includes validation for all four players and game-wide settings.
 * 
 * @param settings - The four-player game settings object to validate
 * @throws ValidationError if any validation fails
 */
export function validateFourPlayerGameSettings(settings: FourPlayerGameSettings): void {
  // Validate all four players' configurations
  [settings.player1, settings.player2, settings.player3, settings.player4].forEach((player, index) => {
    validatePlayerName(player.name, `Player ${index + 1}`);
    validatePlayerColor(player.color, `Player ${index + 1}`);
    validatePlayerType(player.type, `Player ${index + 1}`);
  });
  
  // Validate game-wide settings
  validateScoreLimit(settings.scoreLimit);
  
  // Ensure all player names are unique
  validateUniqueNames([settings.player1, settings.player2, settings.player3, settings.player4], '2v2 match');
}

/**
 * Validate Tournament Settings
 * 
 * Performs comprehensive validation of all aspects of a tournament configuration.
 * This includes validation for all four players and tournament-specific settings.
 * 
 * @param settings - The tournament settings object to validate
 * @throws ValidationError if any validation fails
 */
export function validateTournamentSettings(settings: TournamentSettings): void {
  // Validate all four players' configurations
  [settings.player1, settings.player2, settings.player3, settings.player4].forEach((player, index) => {
    validatePlayerName(player.name, `Player ${index + 1}`);
    validatePlayerColor(player.color, `Player ${index + 1}`);
    validatePlayerType(player.type, `Player ${index + 1}`);
  });
  
  // Validate tournament-specific score limit
  validateScoreLimit(settings.scoreLimit, 'tournament score limit');
  
  // Ensure all player names are unique
  validateUniqueNames([settings.player1, settings.player2, settings.player3, settings.player4], 'tournament');
}

/**
 * Fastify JSON Schemas
 * 
 * These schemas define the expected structure and validation rules for
 * incoming request bodies. Fastify automatically validates requests against
 * these schemas before they reach the route handlers.
 * 
 * Benefits:
 * - Automatic request validation
 * - Consistent error messages
 * - Performance optimization (invalid requests are rejected early)
 * - API documentation generation
 */

/**
 * Schema for 1v1 Game Settings
 * 
 * Defines the validation rules for creating a 1v1 game.
 * This schema is used by the POST /api/game/1v1 endpoint.
 */
export const gameSettingsSchema: FastifySchema = {
  body: {
    type: 'object',
    required: ['player1', 'player2', 'scoreLimit', 'enablePowerUps'],  // All fields are required
    properties: {
      player1: {
        type: 'object',
        required: ['name', 'color', 'type'],  // All player fields are required
        properties: {
          name: { type: 'string', minLength: 1, maxLength: 20 },  // Name length constraints
          color: { type: 'string', enum: ['white', 'lightblue', 'red', 'lightgreen'] },  // Valid colors
          type: { type: 'string', enum: ['human', 'ai'] }  // Valid player types
        }
      },
      player2: {
        type: 'object',
        required: ['name', 'color', 'type'],
        properties: {
          name: { type: 'string', minLength: 1, maxLength: 20 },
          color: { type: 'string', enum: ['white', 'lightblue', 'red', 'lightgreen'] },
          type: { type: 'string', enum: ['human', 'ai'] }
        }
      },
      scoreLimit: { type: 'number', minimum: 1, maximum: 21 },  // Score limit constraints
      enablePowerUps: { type: 'boolean' }  // Boolean flag for power-ups
    }
  }
};

/**
 * Schema for 2v2 Game Settings
 * 
 * Defines the validation rules for creating a 2v2 game.
 * This schema is used by the POST /api/game/2v2 endpoint.
 */
export const fourPlayerGameSettingsSchema: FastifySchema = {
  body: {
    type: 'object',
    required: ['player1', 'player2', 'player3', 'player4', 'scoreLimit', 'enablePowerUps'],
    properties: {
      player1: {
        type: 'object',
        required: ['name', 'color', 'type'],
        properties: {
          name: { type: 'string', minLength: 1, maxLength: 20 },
          color: { type: 'string', enum: ['white', 'lightblue', 'red', 'lightgreen'] },
          type: { type: 'string', enum: ['human', 'ai'] }
        }
      },
      player2: {
        type: 'object',
        required: ['name', 'color', 'type'],
        properties: {
          name: { type: 'string', minLength: 1, maxLength: 20 },
          color: { type: 'string', enum: ['white', 'lightblue', 'red', 'lightgreen'] },
          type: { type: 'string', enum: ['human', 'ai'] }
        }
      },
      player3: {
        type: 'object',
        required: ['name', 'color', 'type'],
        properties: {
          name: { type: 'string', minLength: 1, maxLength: 20 },
          color: { type: 'string', enum: ['white', 'lightblue', 'red', 'lightgreen'] },
          type: { type: 'string', enum: ['human', 'ai'] }
        }
      },
      player4: {
        type: 'object',
        required: ['name', 'color', 'type'],
        properties: {
          name: { type: 'string', minLength: 1, maxLength: 20 },
          color: { type: 'string', enum: ['white', 'lightblue', 'red', 'lightgreen'] },
          type: { type: 'string', enum: ['human', 'ai'] }
        }
      },
      scoreLimit: { type: 'number', minimum: 1, maximum: 21 },
      enablePowerUps: { type: 'boolean' }
    }
  }
};

/**
 * Schema for Tournament Settings
 * 
 * Defines the validation rules for creating a tournament.
 * This schema is used by the POST /api/game/tournament endpoint.
 */
export const tournamentSettingsSchema: FastifySchema = {
  body: {
    type: 'object',
    required: ['player1', 'player2', 'player3', 'player4', 'scoreLimit', 'enablePowerUps'],
    properties: {
      player1: {
        type: 'object',
        required: ['name', 'color', 'type'],
        properties: {
          name: { type: 'string', minLength: 1, maxLength: 20 },
          color: { type: 'string', enum: ['white', 'lightblue', 'red', 'lightgreen'] },
          type: { type: 'string', enum: ['human', 'ai'] }
        }
      },
      player2: {
        type: 'object',
        required: ['name', 'color', 'type'],
        properties: {
          name: { type: 'string', minLength: 1, maxLength: 20 },
          color: { type: 'string', enum: ['white', 'lightblue', 'red', 'lightgreen'] },
          type: { type: 'string', enum: ['human', 'ai'] }
        }
      },
      player3: {
        type: 'object',
        required: ['name', 'color', 'type'],
        properties: {
          name: { type: 'string', minLength: 1, maxLength: 20 },
          color: { type: 'string', enum: ['white', 'lightblue', 'red', 'lightgreen'] },
          type: { type: 'string', enum: ['human', 'ai'] }
        }
      },
      player4: {
        type: 'object',
        required: ['name', 'color', 'type'],
        properties: {
          name: { type: 'string', minLength: 1, maxLength: 20 },
          color: { type: 'string', enum: ['white', 'lightblue', 'red', 'lightgreen'] },
          type: { type: 'string', enum: ['human', 'ai'] }
        }
      },
      scoreLimit: { type: 'number', minimum: 1, maximum: 21 },
      enablePowerUps: { type: 'boolean' }
    }
  }
};
