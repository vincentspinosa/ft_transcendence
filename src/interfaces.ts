// src/interfaces.ts
export interface PlayerConfig {
    name: string;
    color: string;
    type: 'human' | 'ai'; // 'human' or 'ai'
    id: number; // Unique ID (1-4 for tournament, or per player in 4-player match)
}

// Settings for a standard 2-player (1v1) game instance
export interface MatchSettings {
    playerA: PlayerConfig; // Typically left player
    playerB: PlayerConfig; // Typically right player
    scoreLimit: number;
}

// Settings for a 4-player (2v2) game instance
export interface FourPlayerMatchSettings {
    team1PlayerA: PlayerConfig; // Left Top
    team1PlayerB: PlayerConfig; // Left Bottom
    team2PlayerA: PlayerConfig; // Right Top
    team2PlayerB: PlayerConfig; // Right Bottom
    scoreLimit: number;
}

// Settings for the entire tournament (consists of 1v1 matches)
export interface TournamentSetupInfo {
    player1: PlayerConfig;
    player2: PlayerConfig;
    player3: PlayerConfig;
    player4: PlayerConfig;
    pointsToWin: number; // Points to win per match in the tournament
}