import { FastifySchema } from 'fastify';

// Constants for validation
export const VALIDATION_CONSTANTS = {
  MAX_NAME_LENGTH: 20,
  MIN_SCORE_LIMIT: 1,
  MAX_SCORE_LIMIT: 21,
  VALID_COLORS: ['white', 'lightblue', 'red', 'lightgreen'],
  VALID_PLAYER_TYPES: ['human', 'ai']
} as const;

// Types for validation
export interface PlayerConfig {
  name: string;
  color: string;
  type: 'human' | 'ai';
}

export interface GameSettings {
  player1: PlayerConfig;
  player2: PlayerConfig;
  scoreLimit: number;
  enablePowerUps: boolean;
}

export interface FourPlayerGameSettings {
  player1: PlayerConfig;
  player2: PlayerConfig;
  player3: PlayerConfig;
  player4: PlayerConfig;
  scoreLimit: number;
  enablePowerUps: boolean;
}

export interface TournamentSettings {
  player1: PlayerConfig;
  player2: PlayerConfig;
  player3: PlayerConfig;
  player4: PlayerConfig;
  scoreLimit: number;
  enablePowerUps: boolean;
}

// Validation functions
export class ValidationError extends Error {
  constructor(message: string, public field?: string) {
    super(message);
    this.name = 'ValidationError';
  }
}

export function validatePlayerName(name: string, playerLabel: string): void {
  if (!name || name.trim().length === 0) {
    throw new ValidationError(`${playerLabel} name cannot be empty`, 'name');
  }
  
  if (name.length > VALIDATION_CONSTANTS.MAX_NAME_LENGTH) {
    throw new ValidationError(
      `${playerLabel} name cannot exceed ${VALIDATION_CONSTANTS.MAX_NAME_LENGTH} characters`,
      'name'
    );
  }
  
  // Check for potentially dangerous characters
  if (/[<>\"'&]/.test(name)) {
    throw new ValidationError(`${playerLabel} name contains invalid characters`, 'name');
  }
}

export function validatePlayerColor(color: string, playerLabel: string): void {
  if (!VALIDATION_CONSTANTS.VALID_COLORS.includes(color as any)) {
    throw new ValidationError(
      `${playerLabel} color must be one of: ${VALIDATION_CONSTANTS.VALID_COLORS.join(', ')}`,
      'color'
    );
  }
}

export function validatePlayerType(type: string, playerLabel: string): void {
  if (!VALIDATION_CONSTANTS.VALID_PLAYER_TYPES.includes(type as any)) {
    throw new ValidationError(
      `${playerLabel} type must be one of: ${VALIDATION_CONSTANTS.VALID_PLAYER_TYPES.join(', ')}`,
      'type'
    );
  }
}

export function validateScoreLimit(scoreLimit: number, fieldName: string = 'scoreLimit'): void {
  if (!Number.isInteger(scoreLimit)) {
    throw new ValidationError(`${fieldName} must be an integer`, fieldName);
  }
  
  if (scoreLimit < VALIDATION_CONSTANTS.MIN_SCORE_LIMIT || scoreLimit > VALIDATION_CONSTANTS.MAX_SCORE_LIMIT) {
    throw new ValidationError(
      `${fieldName} must be between ${VALIDATION_CONSTANTS.MIN_SCORE_LIMIT} and ${VALIDATION_CONSTANTS.MAX_SCORE_LIMIT}`,
      fieldName
    );
  }
}

export function validateUniqueNames(players: PlayerConfig[], context: string): void {
  const names = players.map(p => p.name.trim().toLowerCase());
  const uniqueNames = new Set(names);
  
  if (names.length !== uniqueNames.size) {
    throw new ValidationError(`All player names must be unique in ${context}`, 'names');
  }
}

export function validateGameSettings(settings: GameSettings): void {
  // Validate player 1
  validatePlayerName(settings.player1.name, 'Player 1');
  validatePlayerColor(settings.player1.color, 'Player 1');
  validatePlayerType(settings.player1.type, 'Player 1');
  
  // Validate player 2
  validatePlayerName(settings.player2.name, 'Player 2');
  validatePlayerColor(settings.player2.color, 'Player 2');
  validatePlayerType(settings.player2.type, 'Player 2');
  
  // Validate score limit
  validateScoreLimit(settings.scoreLimit);
  
  // Validate uniqueness
  validateUniqueNames([settings.player1, settings.player2], '1v1 match');
  
  // Validate power-ups (boolean is already validated by JSON schema)
}

export function validateFourPlayerGameSettings(settings: FourPlayerGameSettings): void {
  // Validate all players
  [settings.player1, settings.player2, settings.player3, settings.player4].forEach((player, index) => {
    validatePlayerName(player.name, `Player ${index + 1}`);
    validatePlayerColor(player.color, `Player ${index + 1}`);
    validatePlayerType(player.type, `Player ${index + 1}`);
  });
  
  // Validate score limit
  validateScoreLimit(settings.scoreLimit);
  
  // Validate uniqueness
  validateUniqueNames([settings.player1, settings.player2, settings.player3, settings.player4], '2v2 match');
}

export function validateTournamentSettings(settings: TournamentSettings): void {
  // Validate all players
  [settings.player1, settings.player2, settings.player3, settings.player4].forEach((player, index) => {
    validatePlayerName(player.name, `Player ${index + 1}`);
    validatePlayerColor(player.color, `Player ${index + 1}`);
    validatePlayerType(player.type, `Player ${index + 1}`);
  });
  
  // Validate score limit
  validateScoreLimit(settings.scoreLimit, 'tournament score limit');
  
  // Validate uniqueness
  validateUniqueNames([settings.player1, settings.player2, settings.player3, settings.player4], 'tournament');
}

// Fastify schemas for request validation
export const gameSettingsSchema: FastifySchema = {
  body: {
    type: 'object',
    required: ['player1', 'player2', 'scoreLimit', 'enablePowerUps'],
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
      scoreLimit: { type: 'number', minimum: 1, maximum: 21 },
      enablePowerUps: { type: 'boolean' }
    }
  }
};

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
