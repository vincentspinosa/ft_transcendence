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
    private scoreLimit: number; // The score limit for each individual match within the tournament.
    private gameInstance: Game; // A reference to the main Game class instance, used to run individual Pong matches.

    private currentMatchIndex: number = 0; // Tracks which match is currently being played (0 for Semi-Final 1, 1 for Semi-Final 2, 2 for The Final).
    private semiFinalWinners: (PlayerConfig | null)[] = [null, null]; // Stores the PlayerConfig of the winners of Semi-Final 1 and Semi-Final 2.
    private tournamentWinner: PlayerConfig | null = null; // Stores the PlayerConfig of the tournament champion.
    private enablePowerUp: boolean; // NEW: Flag to control power-up availability for all tournament matches.

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

    /**
     * Constructs a new Tournament instance.
     * @param settings The setup information for the tournament, including players and points to win.
     * @param gameInstance A reference to the Game class instance that will run individual Pong matches.
     * @param uiElements An object containing references to all necessary HTML elements for UI updates.
     * @param enablePowerUp True if power-ups should be enabled for all matches in this tournament.
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
        },
        enablePowerUp: boolean = false // NEW parameter: whether to enable power-ups
    ) {
        // Initialize tournament properties with values from settings and the game instance.
        this.players = [settings.player1, settings.player2, settings.player3, settings.player4]; // Store all 4 players.
        this.scoreLimit = settings.scoreLimit; // Set the score limit for each match.
        this.gameInstance = gameInstance; // Store the game instance.
        this.enablePowerUp = enablePowerUp; // NEW: Store the power-up setting for the tournament.

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
        if (!this.announceMatchTitleElement) console.log("Tournament Constructor: announceMatchTitleElement is null!");
        if (!this.announceMatchVersusElement) console.log("Tournament Constructor: announceMatchVersusElement is null!");
        if (!this.announceMatchGoButton) console.log("Tournament Constructor: announceMatchGoButton is null!");
        // --- End Verification ---

        // Attach event listener to the "Next Match" button.
        // When clicked, it will call the `proceedToNextStage` method.
        if (this.nextMatchButton) {
            this.nextMatchButton.onclick = () => this.proceedToNextStage();
        } else {
            console.log("Tournament: 'nextMatchButton' not found or passed incorrectly in UI elements.");
        }

        // Attach event listener to the "Go" button on the announcement screen.
        // When clicked, it will call the `startAnnouncedMatch` method.
        if (this.announceMatchGoButton) {
            this.announceMatchGoButton.onclick = () => this.startAnnouncedMatch();
        } else {
            console.log("Tournament: 'announceMatchGoButton' not found or passed incorrectly in UI elements.");
        }
    }

    /**
     * Initiates the tournament process. Resets tournament state and sets up the first match.
     */
    public startTournament(): void {
        this.currentMatchIndex = 0;
        this.semiFinalWinners = [null, null];
        this.tournamentWinner = null;
        this.setupNextMatch();
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
                console.log("Cannot start final: semi-final winners not determined.", this.semiFinalWinners);
                return;
            }
            matchTitle = "THE FINAL";
        } else {
            // Invalid match index, indicating an unexpected state. Log and end tournament.
            console.log("Invalid match index for tournament: " + this.currentMatchIndex);
            return;
        }

        // Additional safeguard to ensure players are defined before proceeding.
        if (!playerA || !playerB) {
            console.log("Players for the match are unexpectedly undefined. Match Title was:", matchTitle);
            return;
        }
        
        // Store the determined players for the current match.
        this.currentMatchPlayers = { playerA: playerA, playerB: playerB };
        
        // --- Log the data that will be displayed on the announcement screen for debugging. ---
        console.log(`Tournament.setupNextMatch: Announcing - Title: "${matchTitle}", Versus: "${playerA.name} plays against ${playerB.name}!"`);
        console.log("Player A details:", JSON.stringify(playerA));
        console.log("Player B details:", JSON.stringify(playerB));
        console.log("Power-Up enabled for tournament:", this.enablePowerUp); // NEW: Log power-up state
        // --- End Log ---

        // Hide other game-related screens (canvas, match over screen) to show the announcement.
        if (this.pongCanvasElement) this.pongCanvasElement.style.display = 'none';
        if (this.matchOverScreenDiv) this.matchOverScreenDiv.style.display = 'none';

        // Update and show the announcement screen with match details.
        if (this.announceMatchTitleElement) {
            this.announceMatchTitleElement.textContent = matchTitle;
        } else { 
            console.log("Tournament.setupNextMatch: announceMatchTitleElement is null, cannot set title.");
        }

        if (this.announceMatchVersusElement) {
            this.announceMatchVersusElement.textContent = `${playerA.name} plays against ${playerB.name}!`;
        } else { 
            console.log("Tournament.setupNextMatch: announceMatchVersusElement is null, cannot set versus text.");
        }

        if (this.matchAnnouncementScreenDiv) {
            this.matchAnnouncementScreenDiv.style.display = 'flex'; // Display the announcement screen.
        } else { 
            console.log("Tournament.setupNextMatch: matchAnnouncementScreenDiv is null, cannot show announcement.");
        }
    }

    /**
     * Starts the Pong match that was previously announced.
     * Hides the announcement screen and displays the canvas.
     */
    private startAnnouncedMatch(): void {
        // Prevent starting if no players are set for the current match.
        if (!this.currentMatchPlayers) {
            console.log("Cannot start match: currentMatchPlayers not set.");
            if (this.matchAnnouncementScreenDiv) this.matchAnnouncementScreenDiv.style.display = 'none';
            return;
        }

        // Log which match is starting for debugging.
        console.log("Tournament.startAnnouncedMatch: Starting match for ", this.currentMatchPlayers.playerA.name, " vs ", this.currentMatchPlayers.playerB.name);

        // Hide the announcement screen and show the Pong canvas.
        if (this.matchAnnouncementScreenDiv) this.matchAnnouncementScreenDiv.style.display = 'none';
        if (this.pongCanvasElement) this.pongCanvasElement.style.display = 'block';

        // Create MatchSettings for the current game.
        const matchSettings: MatchSettings = {
            playerA: this.currentMatchPlayers.playerA,
            playerB: this.currentMatchPlayers.playerB,
            scoreLimit: this.scoreLimit // Use the tournament's points to win.
        };

        // Initialize the Game instance with the match settings.
        // Pass `true` for `isTournamentMatch` and provide a callback for when the match completes.
        // NEW: Pass the enablePowerUp flag here!
        this.gameInstance.initializeGame(matchSettings, true, (winner) => this.handleMatchCompletion(winner), this.enablePowerUp);
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

        if (this.currentMatchIndex === 1) { // If current index is 1, the next match is the second semi-final.
            this.setupNextMatch(); // Set up the next semi-final.
        } else if (this.currentMatchIndex === 2) { // If current index is 2, the next stage is the final.
            // Ensure both semi-final winners are determined before starting the final.
            if (this.semiFinalWinners[0] && this.semiFinalWinners[1]) {
                this.setupNextMatch(); // Set up The Final match.
            } else {
                console.log("Error proceeding to final: one or both semi-final winners are missing.", this.semiFinalWinners);
            }
        } else {
            // This `else` block should ideally not be reached if `displayTournamentWinner` is called correctly after the final.
            console.log("Tournament.proceedToNextStage: Attempted to proceed beyond the final match index or unexpected state.");
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
            console.log("Tournament.displayTournamentWinner: tournamentWinner is null.");
        }
        // Display the tournament winner screen.
        if (this.tournamentWinnerScreenDiv) this.tournamentWinnerScreenDiv.style.display = 'flex';
    }
}