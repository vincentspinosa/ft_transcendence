// src/main.ts

// Import necessary classes and interfaces from other modules.
import { Game } from './Game'; // Imports the core Pong game logic.
import { Tournament } from './Tournament'; // Imports the tournament management logic.
import { PlayerConfig, MatchSettings, TournamentSetupInfo, FourPlayerMatchSettings } from './interfaces'; // Imports data structures for player, match, and tournament configurations.
import { TicTacToe } from './tictactoe'; // NEW: Imports the TicTacToe game logic.

const MAX_NAME_LENGTH = 20; // Maximum allowed length for player names in Pong and Tic-Tac-Toe game modes.

// A map to convert common color names (strings) to their corresponding hexadecimal color codes.
const COLOR_MAP: { [key: string]: string } = {
    "white": "#FFFFFF",
    "lightblue": "#ADD8E6",
    "red": "#FF0000",
    "lightgreen": "#90EE90"
};

// --- Global Game Instances ---
// These variables will hold instances of the Game and Tournament classes.
let gameInstance: Game | null = null; // Instance of the Pong game. Null initially.
let tournamentInstance: Tournament | null = null; // Instance of the Tournament manager. Null initially.
let ticTacToeInstance: TicTacToe | null = null; // NEW: Instance of the TicTacToe game. Null initially.

// --- UI Element Variables ---
// These variables will store references to various HTML elements that make up the game's user interface.
// Each variable corresponds to a distinct "screen" or major section of the application.
let initialChoiceScreen: HTMLElement,      // The main menu screen where users choose a game mode.
    gameSetupScreen: HTMLElement,          // Screen for setting up a 1v1 Pong match.
    fourPlayerMatchSetupScreen: HTMLElement, // Screen for setting up a 2v2 Pong match.
    tournamentSetupScreen: HTMLElement,    // Screen for setting up a Pong tournament.
    rulesScreen: HTMLElement,              // Screen displaying game rules.
    pongCanvas: HTMLCanvasElement,         // The HTML canvas element where Pong game is rendered.
    matchOverScreen: HTMLElement,          // Screen displayed after a single Pong match ends.
    tournamentWinnerScreen: HTMLElement,   // Screen displayed after a tournament concludes, showing the winner.
    matchAnnouncementScreen: HTMLElement,  // Screen used during a tournament to announce upcoming matches.
    ticTacToeSetupScreen: HTMLElement,     // NEW: Screen for setting up a Tic-Tac-Toe game.
    ticTacToeGameScreen: HTMLElement,      // NEW: Screen displaying the Tic-Tac-Toe game board.
    ticTacToeGameOverScreen: HTMLElement;  // NEW: Screen displayed after a Tic-Tac-Toe game ends.

// A map to quickly access HTML elements by their ID, facilitating screen navigation.
const screenElements: { [key: string]: HTMLElement | HTMLCanvasElement } = {};

// References to various buttons and form elements used for user interaction.
let singleMatchModeBtn: HTMLButtonElement,     // Button to select 1v1 Pong mode.
    fourPlayerMatchModeBtn: HTMLButtonElement, // Button to select 2v2 Pong mode.
    tournamentModeBtn: HTMLButtonElement,      // Button to select Tournament mode.
    readRulesBtn: HTMLButtonElement,           // Button to view game rules.
    rules_backToMainBtn: HTMLButtonElement,    // Button to go back to main menu from rules screen.
    s_settingsForm: HTMLFormElement,           // Form for 1v1 Pong match settings.
    s_backToMainBtn: HTMLButtonElement,        // Button to go back to main menu from 1v1 setup.
    fp_settingsForm: HTMLFormElement,          // Form for 4-player Pong match settings.
    fp_backToMainBtn: HTMLButtonElement,       // Button to go back to main menu from 4-player setup.
    t_settingsForm: HTMLFormElement,           // Form for Tournament setup.
    t_backToMainBtn: HTMLButtonElement,        // Button to go back to main menu from tournament setup.
    matchOver_MainMenuBtn: HTMLButtonElement,  // Button to go to main menu from match over screen.
    tournamentEnd_MainMenuBtn: HTMLButtonElement, // Button to go to main menu from tournament winner screen.
    startNewTournamentBtn: HTMLButtonElement;  // Button to start a new tournament from tournament winner screen.

// NEW: Tic-Tac-Toe specific UI elements.
let ticTacToeModeBtn: HTMLButtonElement;        // Button to select Tic-Tac-Toe mode.
let ticTacToeSettingsForm: HTMLFormElement;     // Form for Tic-Tac-Toe game settings.
let tt_backToMainBtn: HTMLButtonElement;  // Button to go back to main menu from Tic-Tac-Toe setup.


/**
 * Hides all known game screens and then displays the specified screen.
 * @param screenToShow The HTMLElement or HTMLCanvasElement to display. If null, all screens are hidden.
 */
function showScreen(screenToShow: HTMLElement | HTMLCanvasElement | null) {
    // List all possible screen elements.
    const allScreens = [
        initialChoiceScreen, gameSetupScreen, fourPlayerMatchSetupScreen, tournamentSetupScreen,
        rulesScreen, pongCanvas, matchOverScreen, tournamentWinnerScreen, matchAnnouncementScreen,
        ticTacToeSetupScreen, ticTacToeGameScreen, ticTacToeGameOverScreen // Includes NEW Tic-Tac-Toe screens.
    ];
    // Iterate through all screens and set their display style to 'none' to hide them.
    allScreens.forEach(s => {
        if (s) s.style.display = 'none';
    });

    // If a screen is specified, set its display style based on its type or ID.
    if (screenToShow) {
        if (screenToShow.id === 'pongCanvas') {
            screenToShow.style.display = 'block'; // Canvas is typically a block element.
        } else if (['initialChoiceScreen', 'matchOverScreen', 'tournamentWinnerScreen', 'matchAnnouncementScreen', 'ticTacToeGameOverScreen'].includes(screenToShow.id)) {
            // These screens are typically centered and should use 'flex' display.
            screenToShow.style.display = 'flex';
        } else {
            // Default to 'block' for other screens.
            screenToShow.style.display = 'block';
        }
    }
}

/**
 * Manages navigation between different screens of the application, updating browser history.
 * @param screenId The ID of the screen to navigate to. If null, navigates to the initial choice screen.
 * @param replaceState If true, replaces the current history entry instead of pushing a new one. Useful for initial load.
 */
function navigateTo(screenId: string | null, replaceState: boolean = false) {
    // Determine the target screen element based on the provided ID.
    const targetScreen = screenId ? screenElements[screenId] : screenElements['initialChoiceScreen'];

    if (targetScreen) {
        const currentHash = window.location.hash.substring(1); // Get current hash from URL.
        // Only update history if the target screen is different or if forced to replace state.
        if (currentHash !== screenId || replaceState) {
            const state = { screenId: screenId || 'initialChoiceScreen' }; // State object for history API.
            // Create a user-friendly title for the browser history.
            const title = screenId ? screenId.replace(/([A-Z])/g, ' $1').trim() : 'Main Menu'; // e.g., "gameSetup" becomes "Game Setup".

            if (replaceState) {
                history.replaceState(state, title, `#${screenId || 'initialChoiceScreen'}`); // Replace current history entry.
            } else {
                history.pushState(state, title, `#${screenId || 'initialChoiceScreen'}`); // Push new history entry.
            }
        }
        showScreen(targetScreen); // Display the target screen.
    } else if (screenId !== 'pongCanvas') { // Warn if a non-canvas screen ID is not found.
        console.warn(`Screen with ID "${screenId}" not found for navigation. Defaulting to initial screen.`);
        navigateTo('initialChoiceScreen', replaceState); // Fallback to initial screen.
    }
}

/**
 * Extracts player configuration from form inputs for general player setup (used in tournament and 4-player).
 * @param formPrefix The prefix used for input element IDs (e.g., 'fp' for four-player).
 * @param playerId The numeric ID of the player (e.g., 1, 2, 3, 4).
 * @param defaultName A default name to use if the name input is empty.
 * @returns An object conforming to the PlayerConfig interface.
 */
function getPlayerConfig(formPrefix: string, playerId: number, defaultName: string): PlayerConfig {
    // Get references to the name, color, and type input/select elements.
    const nameInput = document.getElementById(`${formPrefix}_p${playerId}Name`) as HTMLInputElement;
    const colorSelect = document.getElementById(`${formPrefix}_p${playerId}Color`) as HTMLSelectElement;
    const typeSelect = document.getElementById(`${formPrefix}_p${playerId}Type`) as HTMLSelectElement;

    // Retrieve values, providing defaults if elements are not found or values are empty.
    const name = nameInput?.value.trim() || defaultName;
    const colorValue = colorSelect?.value || 'white';
    const type = (typeSelect?.value as 'human' | 'ai') || 'human'; // Cast to specific union type.

    // Return the player configuration object.
    return { name, color: COLOR_MAP[colorValue] || COLOR_MAP['white'], type, id: playerId };
}

/**
 * Extracts player configuration from form inputs specifically for 1v1 single-player Pong setup.
 * Handles slight differences in ID naming and default player types.
 * @param formPrefix The prefix used for input element IDs (e.g., 's' for single).
 * @param playerId The numeric ID of the player (1 or 2).
 * @param defaultName A default name to use if the name input is empty.
 * @returns An object conforming to the PlayerConfig interface.
 */
function getSinglePlayer1v1Config(formPrefix: string, playerId: number, defaultName: string): PlayerConfig {
    // Get references to name and color elements.
    const nameInput = document.getElementById(`${formPrefix}_player${playerId}Name`) as HTMLInputElement;
    const colorSelect = document.getElementById(`${formPrefix}_player${playerId}Color`) as HTMLSelectElement;
    let type: 'human' | 'ai' = 'human'; // Default type for Player 1 is human.

    // For Player 2, check if there's a type selection (allowing AI).
    if (playerId === 2) {
        const typeSelect = document.getElementById(`${formPrefix}_player${playerId}Type`) as HTMLSelectElement;
        type = (typeSelect?.value as 'human' | 'ai') || 'human';
    } else if (playerId === 1) {
        type = 'human'; // Player 1 is always human in 1v1 setup.
    }

    // Retrieve values.
    const name = nameInput?.value.trim() || defaultName;
    const colorValue = colorSelect?.value || 'white';

    // Return the player configuration object.
    return { name, color: COLOR_MAP[colorValue] || COLOR_MAP['white'], type, id: playerId };
}

/**
 * Validates a player's name against emptiness and a maximum length.
 * @param name The player's name string to validate.
 * @param playerNameLabel A descriptive label for the player (e.g., "Player 1", "AI Player"). Used in alert messages.
 * @param maxLength The maximum allowed length for the name. Defaults to MAX_NAME_LENGTH (20) if not provided.
 * @returns True if the name is valid, false otherwise. Displays an alert if invalid.
 */
function validatePlayerName(name: string, playerNameLabel: string, maxLength: number = MAX_NAME_LENGTH): boolean {
    if (name.length === 0) {
        alert(`${playerNameLabel} name cannot be empty.`); // Alert if name is empty.
        return false;
    }
    if (name.length > maxLength) {
        alert(`${playerNameLabel} name cannot exceed ${maxLength} characters.`); // Alert if name is too long.
        return false;
    }
    return true; // Name is valid.
}

// --- DOM Content Loaded Event Listener ---
// This code runs once the entire HTML document has been fully loaded and parsed.
window.addEventListener('DOMContentLoaded', () => {
    // --- Get References to UI Elements ---
    // Assign HTML elements to their corresponding JavaScript variables using their IDs.
    // This process links the JavaScript logic to the actual structure of the web page.
    initialChoiceScreen = document.getElementById('initialChoiceScreen') as HTMLElement;
    gameSetupScreen = document.getElementById('gameSetup') as HTMLElement;
    fourPlayerMatchSetupScreen = document.getElementById('fourPlayerMatchSetupScreen') as HTMLElement;
    tournamentSetupScreen = document.getElementById('tournamentSetupScreen') as HTMLElement;
    rulesScreen = document.getElementById('rulesScreen') as HTMLElement;
    pongCanvas = document.getElementById('pongCanvas') as HTMLCanvasElement;
    matchOverScreen = document.getElementById('matchOverScreen') as HTMLElement;
    tournamentWinnerScreen = document.getElementById('tournamentWinnerScreen') as HTMLElement;
    matchAnnouncementScreen = document.getElementById('matchAnnouncementScreen') as HTMLElement;
    ticTacToeSetupScreen = document.getElementById('ticTacToeSetupScreen') as HTMLElement;           // NEW: Tic-Tac-Toe setup screen
    ticTacToeGameScreen = document.getElementById('ticTacToeGameScreen') as HTMLElement;             // NEW: Tic-Tac-Toe game screen
    ticTacToeGameOverScreen = document.getElementById('ticTacToeGameOverScreen') as HTMLElement;     // NEW: Tic-Tac-Toe game over screen

    // Populate the `screenElements` map for easier lookup.
    // This allows `MapsTo` function to quickly find elements by ID.
    if (initialChoiceScreen) screenElements['initialChoiceScreen'] = initialChoiceScreen;
    if (gameSetupScreen) screenElements['gameSetup'] = gameSetupScreen;
    if (fourPlayerMatchSetupScreen) screenElements['fourPlayerMatchSetupScreen'] = fourPlayerMatchSetupScreen;
    if (tournamentSetupScreen) screenElements['tournamentSetupScreen'] = tournamentSetupScreen;
    if (rulesScreen) screenElements['rulesScreen'] = rulesScreen;
    if (pongCanvas) screenElements['pongCanvas'] = pongCanvas;
    if (matchOverScreen) screenElements['matchOverScreen'] = matchOverScreen;
    if (tournamentWinnerScreen) screenElements['tournamentWinnerScreen'] = tournamentWinnerScreen;
    if (matchAnnouncementScreen) screenElements['matchAnnouncementScreen'] = matchAnnouncementScreen;
    if (ticTacToeSetupScreen) screenElements['ticTacToeSetupScreen'] = ticTacToeSetupScreen;           // NEW
    if (ticTacToeGameScreen) screenElements['ticTacToeGameScreen'] = ticTacToeGameScreen;             // NEW
    if (ticTacToeGameOverScreen) screenElements['ticTacToeGameOverScreen'] = ticTacToeGameOverScreen; // NEW

    // Get references to buttons and forms.
    singleMatchModeBtn = document.getElementById('singleMatchModeBtn') as HTMLButtonElement;
    fourPlayerMatchModeBtn = document.getElementById('fourPlayerMatchModeBtn') as HTMLButtonElement;
    tournamentModeBtn = document.getElementById('tournamentModeBtn') as HTMLButtonElement;
    readRulesBtn = document.getElementById('readRulesBtn') as HTMLButtonElement;
    rules_backToMainBtn = document.getElementById('rules_backToMainBtn') as HTMLButtonElement;
    s_settingsForm = document.getElementById('settingsForm') as HTMLFormElement;
    s_backToMainBtn = document.getElementById('s_backToMainBtn') as HTMLButtonElement;
    fp_settingsForm = document.getElementById('fourPlayerSettingsForm') as HTMLFormElement;
    fp_backToMainBtn = document.getElementById('fp_backToMainBtn') as HTMLButtonElement;
    t_settingsForm = document.getElementById('tournamentSettingsForm') as HTMLFormElement;
    t_backToMainBtn = document.getElementById('t_backToMainBtn') as HTMLButtonElement;
    matchOver_MainMenuBtn = document.getElementById('matchOver_MainMenuBtn') as HTMLButtonElement;
    tournamentEnd_MainMenuBtn = document.getElementById('tournamentEnd_MainMenuBtn') as HTMLButtonElement;
    startNewTournamentBtn = document.getElementById('startNewTournamentBtn') as HTMLButtonElement;

    ticTacToeModeBtn = document.getElementById('ticTacToeModeBtn') as HTMLButtonElement;                 // NEW: Tic-Tac-Toe mode selection button
    ticTacToeSettingsForm = document.getElementById('ticTacToeSettingsForm') as HTMLFormElement;         // NEW: Tic-Tac-Toe settings form
    tt_backToMainBtn = document.getElementById('tt_backToMainBtn') as HTMLButtonElement;                 // NEW: Tic-Tac-Toe back button


    // --- Game Instance Initialization ---
    // Initialize the Pong game instance. This sets up the canvas and links to relevant UI elements
    // that the Game class will interact with (e.g., displaying match over messages).
    gameInstance = new Game(
        'pongCanvas',
        'matchOverScreen',
        'matchOverMessage',
        'playAgainBtn', // This button might need special handling if it navigates vs just restarts
        'singleMatchOverButtons',
        'tournamentMatchOverButtons'
    );
    // Note: The `playAgainBtn` behavior is handled internally by the `Game` class.
    // If it were to navigate, `MapsTo('gameSetup')` would be called.

    // NEW: Initialize TicTacToe game instance.
    // Similar to Pong, it's linked to its respective UI elements and provides callbacks.
    ticTacToeInstance = new TicTacToe(
        'ticTacToeBoard',            // ID of the Tic-Tac-Toe board container.
        'ticTacToeGameMessage',      // ID of the element to display in-game messages.
        'ticTacToeGameOverScreen',   // ID of the screen shown when Tic-Tac-Toe game ends.
        'ticTacToeGameOverMessage',  // ID of the element for the game over message.
        'tt_playAgainBtn',           // ID for the "Play Again" button in Tic-Tac-Toe.
        'tt_mainMenuBtn',            // ID for the "Main Menu" button in Tic-Tac-Toe.
        (winnerName: string | null) => {
            // Callback function executed when a Tic-Tac-Toe game finishes.
            console.log(`Tic-Tac-Toe game finished. Winner: ${winnerName || 'Draw'}`);
            // Additional logic (e.g., updating stats) could be added here.
        },
        navigateTo // Pass the global `MapsTo` function to TicTacToe for its internal navigation (e.g., from game over to main menu).
    );


    // --- Event Listener Setup for Navigation Buttons ---
    // Attach click event listeners to buttons to trigger screen navigation.
    if (singleMatchModeBtn) singleMatchModeBtn.onclick = () => navigateTo('gameSetup');
    if (fourPlayerMatchModeBtn) fourPlayerMatchModeBtn.onclick = () => navigateTo('fourPlayerMatchSetupScreen');
    if (tournamentModeBtn) tournamentModeBtn.onclick = () => navigateTo('tournamentSetupScreen');
    if (readRulesBtn) readRulesBtn.onclick = () => navigateTo('rulesScreen');
    if (ticTacToeModeBtn) ticTacToeModeBtn.onclick = () => navigateTo('ticTacToeSetupScreen'); // NEW: Tic-Tac-Toe button handler

    // Back buttons from setup/rules screens.
    if (rules_backToMainBtn) rules_backToMainBtn.onclick = () => navigateTo('initialChoiceScreen');
    if (s_backToMainBtn) s_backToMainBtn.onclick = () => navigateTo('initialChoiceScreen');
    if (fp_backToMainBtn) fp_backToMainBtn.onclick = () => navigateTo('initialChoiceScreen');
    if (t_backToMainBtn) t_backToMainBtn.onclick = () => navigateTo('initialChoiceScreen');
    if (tt_backToMainBtn) tt_backToMainBtn.onclick = () => navigateTo('initialChoiceScreen'); // NEW: Tic-Tac-Toe back button handler

    // Post-game/tournament navigation buttons.
    if (matchOver_MainMenuBtn) matchOver_MainMenuBtn.onclick = () => navigateTo('initialChoiceScreen');
    if (tournamentEnd_MainMenuBtn) tournamentEnd_MainMenuBtn.onclick = () => navigateTo('initialChoiceScreen');
    if (startNewTournamentBtn) startNewTournamentBtn.onclick = () => navigateTo('tournamentSetupScreen'); // Allows starting a new tournament directly.


    // --- Browser History (popstate) Handling ---
    // Listen for `popstate` events, which occur when the user navigates through browser history
    // (e.g., using the back/forward buttons). This ensures the UI updates correctly with history changes.
    window.addEventListener('popstate', (event) => {
        if (event.state && event.state.screenId) {
            // If the state object contains a `screenId`, show that screen.
            const screenElement = screenElements[event.state.screenId];
            if (screenElement) {
                showScreen(screenElement); // Just show the screen, don't push state again.
            } else {
                console.warn(`Screen ID "${event.state.screenId}" from popstate not found. Defaulting.`);
                showScreen(initialChoiceScreen); // Fallback if screen ID is invalid.
            }
        } else {
            // If no state (e.g., initial load or manual hash change), determine screen from URL hash.
            const hash = window.location.hash.substring(1);
            const screenElement = hash ? screenElements[hash] : initialChoiceScreen;
            showScreen(screenElement || initialChoiceScreen); // Show the screen based on hash or default.
        }
    });

    // --- Initial Page Load and Deep Linking ---
    // Handle the initial state of the page when it first loads.
    // This allows for "deep linking" (e.g., user directly accesses example.com/#gameSetup).
    const initialHash = window.location.hash.substring(1);
    if (initialHash && screenElements[initialHash]) {
        navigateTo(initialHash, true); // Navigate to the screen specified in the URL hash, replacing initial history entry.
    } else {
        navigateTo('initialChoiceScreen', true); // Default to the initial choice screen, replacing initial history.
    }

    // --- Form Submission Handlers ---
    // Attach submit event listeners to various forms to handle game/tournament setup.

    // 1v1 Pong Game Settings Form Submission
    if (s_settingsForm) {
        s_settingsForm.addEventListener('submit', (e) => {
            e.preventDefault(); // Prevent default form submission to handle it with JavaScript.

            // Get player configurations and score limit from the form.
            const p1 = getSinglePlayer1v1Config('s', 1, 'Player 1');
            const p2 = getSinglePlayer1v1Config('s', 2, 'Player 2');
            const scoreLimitInput = document.getElementById('s_scoreLimit') as HTMLInputElement;
            const scoreLimit = parseInt(scoreLimitInput.value, 10);

            // Validate player names and score limit.
            if (!validatePlayerName(p1.name, "Player 1") || !validatePlayerName(p2.name, "Player 2")) return;
            if (p1.name.toLowerCase() === p2.name.toLowerCase()) {
                alert("Player names must be unique for a single match."); return;
            }
            if (isNaN(scoreLimit) || scoreLimit < 1 || scoreLimit > 21) {
                alert("Score limit must be between 1 and 21."); return;
            }

            // Create the MatchSettings object.
            const matchSettings: MatchSettings = { playerA: p1, playerB: p2, scoreLimit };

            // Initialize and start the Pong game.
            if (gameInstance) {
                // Ensure correct "Match Over" buttons are displayed for a single match.
                const singleMB = document.getElementById('singleMatchOverButtons') as HTMLElement;
                const tourneyMB = document.getElementById('tournamentMatchOverButtons') as HTMLElement;
                if(singleMB) singleMB.style.display = 'block';
                if(tourneyMB) tourneyMB.style.display = 'none';

                gameInstance.initializeGame(matchSettings, false, null); // Initialize Pong for 1v1.
                showScreen(pongCanvas); // Show the Pong game canvas.
                gameInstance.start(); // Start the game loop.
            }
        });
    }

    // 4-Player Pong Match Settings Form Submission
    if (fp_settingsForm) {
        fp_settingsForm.addEventListener('submit', (e) => {
            e.preventDefault();

            // Get player configurations for all four players (two teams).
            const p1_t1 = getPlayerConfig('fp', 1, 'P1(T1)');
            const p2_t1 = getPlayerConfig('fp', 2, 'P2(T1)');
            const p1_t2 = getPlayerConfig('fp', 3, 'P3(T2)');
            const p2_t2 = getPlayerConfig('fp', 4, 'P4(T2)');
            const scoreLimitInput = document.getElementById('fp_scoreLimit') as HTMLInputElement;
            const scoreLimit = parseInt(scoreLimitInput.value, 10);

            // Validate player names and uniqueness, and score limit.
            const players = [p1_t1, p2_t1, p1_t2, p2_t2];
            if (!players.every((p, i) => validatePlayerName(p.name, `Player ${i + 1}`))) return;
            const names = players.map(p => p.name.toLowerCase());
            const uniqueNames = new Set(names);
            if (names.length !== uniqueNames.size) {
                alert("All player names must be unique for a 4-player match."); return;
            }
            if (isNaN(scoreLimit) || scoreLimit < 1 || scoreLimit > 21) {
                alert("Score limit must be between 1 and 21."); return;
            }

            // Create the FourPlayerMatchSettings object.
            const fourPlayerSettings: FourPlayerMatchSettings = {
                team1PlayerA: p1_t1, team1PlayerB: p2_t1,
                team2PlayerA: p1_t2, team2PlayerB: p2_t2,
                scoreLimit
            };

            // Initialize and start the 4-player Pong game.
            if (gameInstance) {
                // Ensure correct "Match Over" buttons are displayed for a 4-player match.
                const singleMB = document.getElementById('singleMatchOverButtons') as HTMLElement;
                const tourneyMB = document.getElementById('tournamentMatchOverButtons') as HTMLElement;
                if(singleMB) singleMB.style.display = 'block';
                if(tourneyMB) tourneyMB.style.display = 'none';

                gameInstance.initializeFourPlayerMatch(fourPlayerSettings); // Initialize Pong for 4 players.
                showScreen(pongCanvas); // Show the Pong canvas.
                gameInstance.start(); // Start the game loop.
            }
        });
    }

    // Tournament Settings Form Submission
    if (t_settingsForm) {
        t_settingsForm.addEventListener('submit', (e) => {
            e.preventDefault();

            // Get player configurations for all four tournament participants.
            const p1 = getPlayerConfig('t', 1, 'Player 1');
            const p2 = getPlayerConfig('t', 2, 'Player 2');
            const p3 = getPlayerConfig('t', 3, 'Player 3');
            const p4 = getPlayerConfig('t', 4, 'Player 4');
            const scoreLimitInput = document.getElementById('t_scoreLimit') as HTMLInputElement;
            const pointsToWin = parseInt(scoreLimitInput.value, 10);

            // Validate player names and uniqueness, and points to win per match.
            if (![p1,p2,p3,p4].every((p, i) => validatePlayerName(p.name, `Player ${i + 1}`))) return;
            const names = [p1.name.toLowerCase(), p2.name.toLowerCase(), p3.name.toLowerCase(), p4.name.toLowerCase()];
            const uniqueNames = new Set(names);
            if (names.length !== uniqueNames.size) {
                alert("Player names in a tournament must be unique."); return;
            }
            if (isNaN(pointsToWin) || pointsToWin < 1 || pointsToWin > 21) {
                alert("Points to win (per match) must be between 1 and 21."); return;
            }

            // Create the TournamentSetupInfo object.
            const tournamentSetupData: TournamentSetupInfo = { player1: p1, player2: p2, player3: p3, player4: p4, pointsToWin };

            // Initialize and start the tournament.
            if (gameInstance) {
                // Create a new Tournament instance, passing setup data, the Pong game instance, and UI element references.
                tournamentInstance = new Tournament(tournamentSetupData, gameInstance, {
                    pongCanvasElement: pongCanvas,
                    matchOverScreenDiv: matchOverScreen,
                    matchOverMessageElement: document.getElementById('matchOverMessage') as HTMLElement,
                    tournamentMatchOverButtonsDiv: document.getElementById('tournamentMatchOverButtons') as HTMLElement,
                    nextMatchButton: document.getElementById('nextMatchBtn') as HTMLButtonElement,
                    tournamentWinnerScreenDiv: tournamentWinnerScreen,
                    tournamentWinnerMessageElement: document.getElementById('tournamentWinnerMessage') as HTMLElement,
                    matchAnnouncementScreenDiv: matchAnnouncementScreen,
                    announceMatchTitleElement: document.getElementById('announceMatchTitleText') as HTMLElement,
                    announceMatchVersusElement: document.getElementById('announceMatchVersusText') as HTMLElement,
                    announceMatchGoButton: document.getElementById('announceMatchGoBtn') as HTMLButtonElement
                });
                tournamentInstance.onTournamentEnd = () => { /* Optional callback for when the tournament finishes */ };
                showScreen(null); // Hide the current setup screen before tournament starts.
                tournamentInstance.startTournament(); // Begin the tournament flow.
            }
        });
    }

    // NEW: Tic-Tac-Toe Settings Form Submission
    if (ticTacToeSettingsForm) {
        ticTacToeSettingsForm.addEventListener('submit', (e) => {
            e.preventDefault();

            // Get player names from the Tic-Tac-Toe setup form.
            const p1NameInput = document.getElementById('tt_player1Name') as HTMLInputElement;
            const p2NameInput = document.getElementById('tt_player2Name') as HTMLInputElement;

            const p1Name = p1NameInput?.value.trim() || 'Player 1 (X)';
            const p2Name = p2NameInput?.value.trim() || 'Player 2 (O)';

            // Validate player names using the updated function signature with specific max length for Tic-Tac-Toe.
            if (!validatePlayerName(p1Name, "Player 1", MAX_NAME_LENGTH) ||
                !validatePlayerName(p2Name, "Player 2", MAX_NAME_LENGTH)) {
                return; // Stop if validation fails.
            }

            // Ensure player names are unique for Tic-Tac-Toe.
            if (p1Name.toLowerCase() === p2Name.toLowerCase()) {
                alert("Tic-Tac-Toe player names must be unique.");
                return;
            }

            // Initialize and navigate to the Tic-Tac-Toe game screen.
            if (ticTacToeInstance) {
                ticTacToeInstance.initializeGame(p1Name, p2Name); // Initialize Tic-Tac-Toe with player names.
                navigateTo('ticTacToeGameScreen'); // Show the Tic-Tac-Toe game board.
            }
        });
    }

    // --- Critical UI Element Check ---
    // Define a list of IDs for critical HTML elements that must be present for the application to function.
    const criticalElementIds: string[] = [
        'initialChoiceScreen', 'gameSetup', 'fourPlayerMatchSetupScreen', 'tournamentSetupScreen', 'rulesScreen', 'pongCanvas',
        'matchOverScreen', 'tournamentWinnerScreen', 'matchAnnouncementScreen',
        'singleMatchModeBtn', 'fourPlayerMatchModeBtn', 'tournamentModeBtn', 'readRulesBtn', 'rules_backToMainBtn',
        'settingsForm', 's_backToMainBtn', 'fourPlayerSettingsForm', 'fp_backToMainBtn', 'tournamentSettingsForm', 't_backToMainBtn',
        'matchOver_MainMenuBtn', 'tournamentEnd_MainMenuBtn', 'startNewTournamentBtn',
        'announceMatchTitleText', 'announceMatchVersusText', 'announceMatchGoBtn',
        'matchOverMessage', 'playAgainBtn', 'singleMatchOverButtons', 'tournamentMatchOverButtons',
        'nextMatchBtn',
        // NEW Tic-Tac-Toe specific elements added to the critical list.
        'ticTacToeModeBtn', 'ticTacToeSetupScreen', 'ticTacToeGameScreen', 'ticTacToeGameOverScreen',
        'ticTacToeSettingsForm', 'tt_backToMainBtn', 'tt_player1Name', 'tt_player2Name', 'tt_startGameBtn',
        'ticTacToeBoard', 'ticTacToeGameMessage',
        'ticTacToeGameOverMessage', 'tt_playAgainBtn', 'tt_mainMenuBtn'
    ];
    
    // Iterate through the critical elements and check if they exist in the DOM.
    let allElementsFound = true;
    criticalElementIds.forEach(id => {
        if (!document.getElementById(id)) {
            console.error(`Critical UI element with ID '${id}' was not found. Check HTML.`);
            allElementsFound = false; // Set flag to false if any element is missing.
        }
    });

    // Log the result of the critical element check.
    if(allElementsFound) console.log("All critical UI elements successfully referenced (initial check).");
    else console.error("One or more critical UI elements are missing. Application may not function correctly.");

}); // End of DOMContentLoaded event listener.