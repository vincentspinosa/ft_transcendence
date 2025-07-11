// src/Tournament.ts

// Import necessary interfaces and classes for player configurations, tournament setup, and the core game logic.
import { PlayerConfig, TournamentSetupInfo, MatchSettings } from './interfaces';
import { Game } from './Game';

/**
 * Manages the flow of a Pong tournament, including setting up matches,
 * tracking winners, and advancing through semi-finals to a final.
 */
export class Tournament {
    // Private properties to store tournament state and configuration.
    private players: PlayerConfig[]; // An array of all player configurations participating in the tournament (4 players).
    private pointsToWin: number; // The score limit for each individual match within the tournament.
    private gameInstance: Game; // A reference to the main Game class instance, used to run individual Pong matches.

    private currentMatchIndex: number = 0; // Tracks which match is currently being played (0 for Semi-Final 1, 1 for Semi-Final 2, 2 for The Final).
    private semiFinalWinners: (PlayerConfig | null)[] = [null, null]; // Stores the PlayerConfig of the winners of Semi-Final 1 and Semi-Final 2.
    private tournamentWinner: PlayerConfig | null = null; // Stores the PlayerConfig of the ultimate tournament champion.

    // HTML Elements for updating the User Interface.
    private pongCanvasElement: HTMLCanvasElement; // The canvas element where Pong matches are rendered.
    private matchOverScreenDiv: HTMLElement; // The div displayed when a single match ends.
    private matchOverMessageElement: HTMLElement; // The element within matchOverScreenDiv that displays the match winner message.
    private tournamentMatchOverButtonsDiv: HTMLElement; // The container for buttons (e.g., "Next Match") shown after a tournament match.
    private nextMatchButton: HTMLButtonElement; // The button to proceed to the next match in the tournament.
    private tournamentWinnerScreenDiv: HTMLElement; // The div displayed when the entire tournament concludes.
    private tournamentWinnerMessageElement: HTMLElement; // The element within tournamentWinnerScreenDiv that displays the tournament champion message.

    // HTML Elements for the pre-match announcement screen.
    private matchAnnouncementScreenDiv: HTMLElement; // The div displayed to announce an upcoming match.
    private announceMatchTitleElement: HTMLElement; // The element displaying the match title (e.g., "Semi-Final 1").
    private announceMatchVersusElement: HTMLElement; // The element displaying the players facing each other (e.g., "Player A plays against Player B!").
    private announceMatchGoButton: HTMLButtonElement; // The button to start the announced match.

    private currentMatchPlayers: { playerA: PlayerConfig, playerB: PlayerConfig } | null = null; // Temporarily holds the PlayerConfig for the current match being announced/played.

    public onTournamentEnd: (() => void) | null = null; // Callback function to be executed when the tournament finishes.

    /**
     * Constructs a new Tournament instance.
     * @param settings The setup information for the tournament, including players and points to win.
     * @param gameInstance A reference to the Game class instance that will run individual Pong matches.
     * @param uiElements An object containing references to all necessary HTML elements for UI updates.
     */
    constructor(
        settings: TournamentSetupInfo,
        gameInstance: Game,
        uiElements: {
            pongCanvasElement: HTMLCanvasElement,
            matchOverScreenDiv: HTMLElement,
            matchOverMessageElement: HTMLElement,
            tournamentMatchOverButtonsDiv: HTMLElement,
            nextMatchButton: HTMLButtonElement,
            tournamentWinnerScreenDiv: HTMLElement,
            tournamentWinnerMessageElement: HTMLElement,
            matchAnnouncementScreenDiv: HTMLElement,
            announceMatchTitleElement: HTMLElement,
            announceMatchVersusElement: HTMLElement,
            announceMatchGoButton: HTMLButtonElement
        }
    ) {
        // Initialize tournament properties with values from settings and the game instance.
        this.players = [settings.player1, settings.player2, settings.player3, settings.player4]; // Store all 4 players.
        this.pointsToWin = settings.pointsToWin; // Set the score limit for each match.
        this.gameInstance = gameInstance; // Store the game instance.

        // Assign UI element references from the passed object.
        this.pongCanvasElement = uiElements.pongCanvasElement;
        this.matchOverScreenDiv = uiElements.matchOverScreenDiv;
        this.matchOverMessageElement = uiElements.matchOverMessageElement;
        this.tournamentMatchOverButtonsDiv = uiElements.tournamentMatchOverButtonsDiv;
        this.nextMatchButton = uiElements.nextMatchButton;
        this.tournamentWinnerScreenDiv = uiElements.tournamentWinnerScreenDiv;
        this.tournamentWinnerMessageElement = uiElements.tournamentWinnerMessageElement;

        this.matchAnnouncementScreenDiv = uiElements.matchAnnouncementScreenDiv;
        this.announceMatchTitleElement = uiElements.announceMatchTitleElement;
        this.announceMatchVersusElement = uiElements.announceMatchVersusElement;
        this.announceMatchGoButton = uiElements.announceMatchGoButton;

        // --- Basic Verification of UI Elements ---
        // Log errors to the console if any critical UI elements are not provided.
        if (!this.announceMatchTitleElement) console.error("Tournament Constructor: announceMatchTitleElement is null!");
        if (!this.announceMatchVersusElement) console.error("Tournament Constructor: announceMatchVersusElement is null!");
        if (!this.announceMatchGoButton) console.error("Tournament Constructor: announceMatchGoButton is null!");
        // --- End Verification ---

        // Attach event listener to the "Next Match" button.
        // When clicked, it will call the `proceedToNextStage` method.
        if (this.nextMatchButton) {
            this.nextMatchButton.onclick = () => this.proceedToNextStage();
        } else {
            console.error("Tournament: 'nextMatchButton' not found or passed incorrectly in UI elements.");
        }

        // Attach event listener to the "Go" button on the announcement screen.
        // When clicked, it will call the `startAnnouncedMatch` method.
        if (this.announceMatchGoButton) {
            this.announceMatchGoButton.onclick = () => this.startAnnouncedMatch();
        } else {
            console.error("Tournament: 'announceMatchGoButton' not found or passed incorrectly in UI elements.");
        }
    }

    /**
     * Initiates the tournament process. Resets tournament state and sets up the first match.
     */
    public startTournament(): void {
        this.currentMatchIndex = 0; // Reset match index to start from the first semi-final.
        this.semiFinalWinners = [null, null]; // Clear previous semi-final winners.
        this.tournamentWinner = null; // Clear any previous tournament winner.
        this.setupNextMatch(); // Begin by setting up the first match.
    }

    /**
     * Determines which match should be played next based on `currentMatchIndex`
     * and updates the UI to announce this match.
     */
    private setupNextMatch(): void {
        let playerA: PlayerConfig | null = null;
        let playerB: PlayerConfig | null = null;
        let matchTitle = "";

        // Log the current match index for debugging.
        console.log(`Tournament.setupNextMatch: Current index: ${this.currentMatchIndex}`);

        // Logic to determine players and title for the current match.
        if (this.currentMatchIndex === 0) {
            // Semi-Final 1: Player 1 vs Player 2 from the initial setup.
            playerA = this.players[0];
            playerB = this.players[1];
            matchTitle = "Semi-Final 1";
        } else if (this.currentMatchIndex === 1) {
            // Semi-Final 2: Player 3 vs Player 4 from the initial setup.
            playerA = this.players[2];
            playerB = this.players[3];
            matchTitle = "Semi-Final 2";
        } else if (this.currentMatchIndex === 2) {
            // The Final: Winners of Semi-Final 1 and Semi-Final 2.
            playerA = this.semiFinalWinners[0];
            playerB = this.semiFinalWinners[1];
            // If for some reason semi-final winners are not determined, log an error and end the tournament.
            if (!playerA || !playerB) {
                console.error("Cannot start final: semi-final winners not determined.", this.semiFinalWinners);
                if (this.onTournamentEnd) this.onTournamentEnd(); // Call end callback.
                return;
            }
            matchTitle = "THE FINAL";
        } else {
            // Invalid match index, indicating an unexpected state. Log and end tournament.
            console.error("Invalid match index for tournament: " + this.currentMatchIndex);
            if (this.onTournamentEnd) this.onTournamentEnd(); // Call end callback.
            return;
        }

        // Additional safeguard to ensure players are defined before proceeding.
        if (!playerA || !playerB) {
            console.error("Players for the match are unexpectedly undefined. Match Title was:", matchTitle);
            if (this.onTournamentEnd) this.onTournamentEnd();
            return;
        }
        
        // Store the determined players for the current match.
        this.currentMatchPlayers = { playerA: playerA, playerB: playerB };
        
        // --- Log the data that will be displayed on the announcement screen for debugging. ---
        console.log(`Tournament.setupNextMatch: Announcing - Title: "${matchTitle}", Versus: "${playerA.name} plays against ${playerB.name}!"`);
        console.log("Player A details:", JSON.stringify(playerA));
        console.log("Player B details:", JSON.stringify(playerB));
        // --- End Log ---

        // Hide other game-related screens (canvas, match over screen) to show the announcement.
        if (this.pongCanvasElement) this.pongCanvasElement.style.display = 'none';
        if (this.matchOverScreenDiv) this.matchOverScreenDiv.style.display = 'none';

        // Update and show the announcement screen with match details.
        if (this.announceMatchTitleElement) {
            this.announceMatchTitleElement.textContent = matchTitle;
        } else { 
            console.error("Tournament.setupNextMatch: announceMatchTitleElement is null, cannot set title.");
        }

        if (this.announceMatchVersusElement) {
            this.announceMatchVersusElement.textContent = `${playerA.name} plays against ${playerB.name}!`;
        } else { 
            console.error("Tournament.setupNextMatch: announceMatchVersusElement is null, cannot set versus text.");
        }

        if (this.matchAnnouncementScreenDiv) {
            this.matchAnnouncementScreenDiv.style.display = 'flex'; // Display the announcement screen (typically centered).
        } else { 
            console.error("Tournament.setupNextMatch: matchAnnouncementScreenDiv is null, cannot show announcement.");
        }
    }

    /**
     * Starts the Pong match that was previously announced.
     * Hides the announcement screen and displays the canvas.
     */
    private startAnnouncedMatch(): void {
        // Prevent starting if no players are set for the current match.
        if (!this.currentMatchPlayers) {
            console.error("Cannot start match: currentMatchPlayers not set (Go button clicked too early or error).");
            if (this.matchAnnouncementScreenDiv) this.matchAnnouncementScreenDiv.style.display = 'none';
            if (this.onTournamentEnd) this.onTournamentEnd(); // End tournament if an error occurs.
            return;
        }

        // Log which match is starting for debugging.
        console.log("Tournament.startAnnouncedMatch: Starting match for", this.currentMatchPlayers.playerA.name, "vs", this.currentMatchPlayers.playerB.name);

        // Hide the announcement screen and show the Pong canvas.
        if (this.matchAnnouncementScreenDiv) this.matchAnnouncementScreenDiv.style.display = 'none';
        if (this.pongCanvasElement) this.pongCanvasElement.style.display = 'block';

        // Create MatchSettings for the current game.
        const matchSettings: MatchSettings = {
            playerA: this.currentMatchPlayers.playerA,
            playerB: this.currentMatchPlayers.playerB,
            scoreLimit: this.pointsToWin // Use the tournament's points to win.
        };

        // Initialize the Game instance with the match settings.
        // Pass `true` for `isTournamentMatch` and provide a callback for when the match completes.
        this.gameInstance.initializeGame(matchSettings, true, (winner) => this.handleMatchCompletion(winner));
        this.gameInstance.start(); // Start the actual Pong game.
    }

    /**
     * Handles the completion of an individual match within the tournament.
     * Updates tournament state with the winner and displays the match over screen.
     * @param winner The PlayerConfig of the player who won the completed match.
     */
    private handleMatchCompletion(winner: PlayerConfig): void {
        // Log the winner of the current match for debugging.
        console.log(`Tournament.handleMatchCompletion: Match ${this.currentMatchIndex + 1} winner: ${winner.name}`);

        // Hide the Pong canvas and display the match over screen.
        if (this.pongCanvasElement) this.pongCanvasElement.style.display = 'none';
        // Update the message on the match over screen.
        if (this.matchOverMessageElement) this.matchOverMessageElement.textContent = `${winner.name} wins the match!`;
        
        // Hide single match specific buttons and show tournament-specific buttons (e.g., "Next Match").
        const singleMatchButtons = this.matchOverScreenDiv?.querySelector('#singleMatchOverButtons') as HTMLElement;
        if (singleMatchButtons) singleMatchButtons.style.display = 'none';
        if (this.tournamentMatchOverButtonsDiv) this.tournamentMatchOverButtonsDiv.style.display = 'block';
        if (this.matchOverScreenDiv) this.matchOverScreenDiv.style.display = 'flex'; // Display the match over screen.

        // Store the winner based on the current match index.
        if (this.currentMatchIndex === 0) {
            this.semiFinalWinners[0] = winner; // Winner of Semi-Final 1.
        } else if (this.currentMatchIndex === 1) {
            this.semiFinalWinners[1] = winner; // Winner of Semi-Final 2.
        } else if (this.currentMatchIndex === 2) {
            this.tournamentWinner = winner; // Winner of The Final is the tournament champion.
            this.displayTournamentWinner(); // Immediately display the tournament winner.
            return; // Exit as the tournament has concluded.
        }
        // Note: The `proceedToNextStage()` method is called by the "Next Match" button's click handler,
        // allowing the user to control progression.
    }
    
    /**
     * Advances the tournament to the next match or declares the tournament winner.
     * This method is typically called by the "Next Match" button.
     */
    private proceedToNextStage(): void {
        console.log("Tournament.proceedToNextStage: Advancing from match index", this.currentMatchIndex);
        this.currentMatchIndex++; // Increment the match index to move to the next stage.

        if (this.currentMatchIndex < 2) { // If current index is 0 or 1, the next match is a semi-final (or the other semi-final).
            this.setupNextMatch(); // Set up the next semi-final.
        } else if (this.currentMatchIndex === 2) { // If current index is 2, the next stage is the final.
            // Ensure both semi-final winners are determined before starting the final.
            if (this.semiFinalWinners[0] && this.semiFinalWinners[1]) {
                this.setupNextMatch(); // Set up The Final match.
            } else {
                console.error("Error proceeding to final: one or both semi-final winners are missing.", this.semiFinalWinners);
                if (this.onTournamentEnd) this.onTournamentEnd(); // Call end callback if an error prevents final.
            }
        } else {
            // This `else` block should ideally not be reached if `displayTournamentWinner` is called correctly after the final.
            console.warn("Tournament.proceedToNextStage: Attempted to proceed beyond the final match index or unexpected state.");
            if (!this.tournamentWinner && this.onTournamentEnd) { // If for some reason the tournament didn't conclude properly.
                this.onTournamentEnd(); // Call the tournament end callback.
            }
        }
    }

    /**
     * Displays the tournament winner screen with the champion's name.
     * This method is called after the final match concludes.
     */
    private displayTournamentWinner(): void {
        console.log(`Tournament.displayTournamentWinner: Champion is ${this.tournamentWinner?.name}`);
        // Hide other screens that might be active (match over, announcement).
        if (this.matchOverScreenDiv) this.matchOverScreenDiv.style.display = 'none';
        if (this.matchAnnouncementScreenDiv) this.matchAnnouncementScreenDiv.style.display = 'none';

        // Update the message on the tournament winner screen.
        if (this.tournamentWinnerMessageElement && this.tournamentWinner) {
            this.tournamentWinnerMessageElement.textContent = `Congratulations! ${this.tournamentWinner.name} has won the tournament!`;
        } else if (this.tournamentWinnerMessageElement) {
            this.tournamentWinnerMessageElement.textContent = `The tournament has concluded!`; // Fallback message if winner is not set.
            console.error("Tournament.displayTournamentWinner: tournamentWinner is null.");
        }
        // Display the tournament winner screen.
        if (this.tournamentWinnerScreenDiv) this.tournamentWinnerScreenDiv.style.display = 'flex';
        // Call `onTournamentEnd` callback to signal the main application that the tournament is over.
        if (this.onTournamentEnd) this.onTournamentEnd();
    }
}