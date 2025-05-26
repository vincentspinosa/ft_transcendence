// src/Tournament.ts
import { PlayerConfig, TournamentSetupInfo, MatchSettings } from './interfaces';
import { Game } from './Game';

export class Tournament {
    private players: PlayerConfig[];
    private pointsToWin: number;
    private gameInstance: Game;

    private currentMatchIndex: number = 0;
    private semiFinalWinners: (PlayerConfig | null)[] = [null, null];
    private tournamentWinner: PlayerConfig | null = null;

    // HTML Elements for UI updates
    private pongCanvasElement: HTMLCanvasElement;
    private matchOverScreenDiv: HTMLElement;
    private matchOverMessageElement: HTMLElement;
    private tournamentMatchOverButtonsDiv: HTMLElement;
    private nextMatchButton: HTMLButtonElement;
    private tournamentWinnerScreenDiv: HTMLElement;
    private tournamentWinnerMessageElement: HTMLElement;

    // Elements for the pre-match announcement view
    private matchAnnouncementScreenDiv: HTMLElement;
    private announceMatchTitleElement: HTMLElement;
    private announceMatchVersusElement: HTMLElement;
    private announceMatchGoButton: HTMLButtonElement;

    private currentMatchPlayers: { playerA: PlayerConfig, playerB: PlayerConfig } | null = null;

    public onTournamentEnd: (() => void) | null = null;

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
        this.players = [settings.player1, settings.player2, settings.player3, settings.player4];
        this.pointsToWin = settings.pointsToWin;
        this.gameInstance = gameInstance;

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

        // --- Verify elements are received ---
        if (!this.announceMatchTitleElement) console.error("Tournament Constructor: announceMatchTitleElement is null!");
        if (!this.announceMatchVersusElement) console.error("Tournament Constructor: announceMatchVersusElement is null!");
        if (!this.announceMatchGoButton) console.error("Tournament Constructor: announceMatchGoButton is null!");
        // --- End Verify ---


        if (this.nextMatchButton) {
            this.nextMatchButton.onclick = () => this.proceedToNextStage();
        } else {
            console.error("Tournament: 'nextMatchButton' not found or passed incorrectly in UI elements.");
        }

        if (this.announceMatchGoButton) {
            this.announceMatchGoButton.onclick = () => this.startAnnouncedMatch();
        } else {
            console.error("Tournament: 'announceMatchGoButton' not found or passed incorrectly in UI elements.");
        }
    }

    public startTournament(): void {
        this.currentMatchIndex = 0;
        this.semiFinalWinners = [null, null];
        this.tournamentWinner = null;
        this.setupNextMatch();
    }

    private setupNextMatch(): void {
        let playerA: PlayerConfig | null = null;
        let playerB: PlayerConfig | null = null;
        let matchTitle = "";

        console.log(`Tournament.setupNextMatch: Current index: ${this.currentMatchIndex}`); // Log current index

        if (this.currentMatchIndex === 0) {
            playerA = this.players[0]; playerB = this.players[1];
            matchTitle = "Semi-Final 1";
        } else if (this.currentMatchIndex === 1) {
            playerA = this.players[2]; playerB = this.players[3];
            matchTitle = "Semi-Final 2";
        } else if (this.currentMatchIndex === 2) {
            playerA = this.semiFinalWinners[0]; playerB = this.semiFinalWinners[1];
            if (!playerA || !playerB) {
                console.error("Cannot start final: semi-final winners not determined.", this.semiFinalWinners);
                if (this.onTournamentEnd) this.onTournamentEnd(); return;
            }
            matchTitle = "THE FINAL";
        } else {
            console.error("Invalid match index for tournament: " + this.currentMatchIndex);
            if (this.onTournamentEnd) this.onTournamentEnd(); return;
        }

        // Safeguard check, though above logic should handle it.
        if (!playerA || !playerB) {
            console.error("Players for the match are unexpectedly undefined. Match Title was:", matchTitle);
            if (this.onTournamentEnd) this.onTournamentEnd(); return;
        }
        
        this.currentMatchPlayers = { playerA: playerA, playerB: playerB };
        
        // --- Log the data that will be displayed ---
        console.log(`Tournament.setupNextMatch: Announcing - Title: "${matchTitle}", Versus: "${playerA.name} plays against ${playerB.name}!"`);
        console.log("Player A details:", JSON.stringify(playerA));
        console.log("Player B details:", JSON.stringify(playerB));
        // --- End Log ---

        // Hide other game-related screens
        if (this.pongCanvasElement) this.pongCanvasElement.style.display = 'none';
        if (this.matchOverScreenDiv) this.matchOverScreenDiv.style.display = 'none';

        // Setup and show the announcement screen
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
            this.matchAnnouncementScreenDiv.style.display = 'flex'; // Show announcement screen
        } else { 
            console.error("Tournament.setupNextMatch: matchAnnouncementScreenDiv is null, cannot show announcement.");
        }
    }

    private startAnnouncedMatch(): void {
        if (!this.currentMatchPlayers) {
            console.error("Cannot start match: currentMatchPlayers not set (Go button clicked too early or error).");
            if (this.matchAnnouncementScreenDiv) this.matchAnnouncementScreenDiv.style.display = 'none';
            if (this.onTournamentEnd) this.onTournamentEnd();
            return;
        }

        console.log("Tournament.startAnnouncedMatch: Starting match for", this.currentMatchPlayers.playerA.name, "vs", this.currentMatchPlayers.playerB.name);

        if (this.matchAnnouncementScreenDiv) this.matchAnnouncementScreenDiv.style.display = 'none';
        if (this.pongCanvasElement) this.pongCanvasElement.style.display = 'block';

        const matchSettings: MatchSettings = {
            playerA: this.currentMatchPlayers.playerA,
            playerB: this.currentMatchPlayers.playerB,
            scoreLimit: this.pointsToWin
        };
        this.gameInstance.initializeGame(matchSettings, true, (winner) => this.handleMatchCompletion(winner));
        this.gameInstance.start();
    }

    private handleMatchCompletion(winner: PlayerConfig): void {
        console.log(`Tournament.handleMatchCompletion: Match ${this.currentMatchIndex + 1} winner: ${winner.name}`);
        if (this.pongCanvasElement) this.pongCanvasElement.style.display = 'none';
        if (this.matchOverMessageElement) this.matchOverMessageElement.textContent = `${winner.name} wins the match!`;
        
        const singleMatchButtons = this.matchOverScreenDiv?.querySelector('#singleMatchOverButtons') as HTMLElement;
        if (singleMatchButtons) singleMatchButtons.style.display = 'none';
        if (this.tournamentMatchOverButtonsDiv) this.tournamentMatchOverButtonsDiv.style.display = 'block';
        if (this.matchOverScreenDiv) this.matchOverScreenDiv.style.display = 'flex';

        if (this.currentMatchIndex === 0) {
            this.semiFinalWinners[0] = winner;
        } else if (this.currentMatchIndex === 1) {
            this.semiFinalWinners[1] = winner;
        } else if (this.currentMatchIndex === 2) {
            this.tournamentWinner = winner;
            this.displayTournamentWinner();
            return; 
        }
        // Note: proceedToNextStage() is called by the "Next Match" button's event handler
    }
    
    private proceedToNextStage(): void {
        console.log("Tournament.proceedToNextStage: Advancing from match index", this.currentMatchIndex);
        this.currentMatchIndex++;
        if (this.currentMatchIndex < 2) { // Next match is a semi-final or the other semi-final
            this.setupNextMatch();
        } else if (this.currentMatchIndex === 2) { // Next match is the final
            if (this.semiFinalWinners[0] && this.semiFinalWinners[1]) {
                this.setupNextMatch();
            } else {
                console.error("Error proceeding to final: one or both semi-final winners are missing.", this.semiFinalWinners);
                if (this.onTournamentEnd) this.onTournamentEnd(); // Potentially go to main menu or show error
            }
        } else {
            // This should ideally not be reached if displayTournamentWinner was called after the final.
            console.warn("Tournament.proceedToNextStage: Attempted to proceed beyond the final match index or unexpected state.");
            if (!this.tournamentWinner && this.onTournamentEnd) { // If somehow tournament didn't conclude properly
                this.onTournamentEnd();
            }
        }
    }

    private displayTournamentWinner(): void {
        console.log(`Tournament.displayTournamentWinner: Champion is ${this.tournamentWinner?.name}`);
        if (this.matchOverScreenDiv) this.matchOverScreenDiv.style.display = 'none';
        if (this.matchAnnouncementScreenDiv) this.matchAnnouncementScreenDiv.style.display = 'none';
        if (this.tournamentWinnerMessageElement && this.tournamentWinner) {
            this.tournamentWinnerMessageElement.textContent = `Congratulations! ${this.tournamentWinner.name} has won the tournament!`;
        } else if (this.tournamentWinnerMessageElement) {
            this.tournamentWinnerMessageElement.textContent = `The tournament has concluded!`; // Fallback
            console.error("Tournament.displayTournamentWinner: tournamentWinner is null.");
        }
        if (this.tournamentWinnerScreenDiv) this.tournamentWinnerScreenDiv.style.display = 'flex';
        if (this.onTournamentEnd) this.onTournamentEnd();
    }
}