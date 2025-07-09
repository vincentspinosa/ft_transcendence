// src/tictactoe.ts

/**
 * Manages the Tic-Tac-Toe game logic and rendering.
 */
export class TicTacToe {
    private board: (string | null)[]; // Represents the 3x3 game board
    private currentPlayer: string; // 'X' or 'O'
    private gameActive: boolean; // True if the game is in progress
    private player1Name!: string; // ADDED "!"
    private player2Name!: string; // ADDED "!"
    private player1Symbol: string = 'X'; // Player 1 always uses 'X'
    private player2Symbol: string = 'O'; // Player 2 always uses 'O'

    // DOM Elements
    private gameBoardElement: HTMLElement; // The container for the Tic-Tac-Toe cells
    private gameMessageElement: HTMLElement; // Displays current turn or game outcome
    private gameOverScreen: HTMLElement; // Screen shown after game ends
    private gameOverMessageElement: HTMLElement; // Message on the game over screen
    private playAgainButton: HTMLButtonElement; // Button to play another game
    private mainMenuButton: HTMLButtonElement; // Button to return to main menu

    // Callbacks to the main application for navigation and game end notifications
    private onGameEndCallback: (winnerName: string | null) => void;
    private navigateToScreenCallback: (screenId: string) => void;

    /**
     * @param gameBoardId The ID of the HTML element that will host the Tic-Tac-Toe board cells.
     * @param gameMessageId The ID of the HTML element to display game messages (e.g., current turn).
     * @param gameOverScreenId The ID of the HTML element representing the game over screen.
     * @param gameOverMessageId The ID of the HTML element to display the winner/draw message on the game over screen.
     * @param playAgainButtonId The ID of the "Play Again" button on the game over screen.
     * @param mainMenuButtonId The ID of the "Main Menu" button on the game over screen.
     * @param onGameEndCallback A callback function to be executed when the game ends (e.g., to notify main.ts).
     * @param navigateToScreenCallback A callback function to navigate to a different screen (provided by main.ts).
     */
    constructor(
        gameBoardId: string,
        gameMessageId: string,
        gameOverScreenId: string,
        gameOverMessageId: string,
        playAgainButtonId: string,
        mainMenuButtonId: string,
        onGameEndCallback: (winnerName: string | null) => void,
        navigateToScreenCallback: (screenId: string) => void
    ) {
        // Get references to DOM elements
        this.gameBoardElement = document.getElementById(gameBoardId) as HTMLElement;
        this.gameMessageElement = document.getElementById(gameMessageId) as HTMLElement;
        this.gameOverScreen = document.getElementById(gameOverScreenId) as HTMLElement;
        this.gameOverMessageElement = document.getElementById(gameOverMessageId) as HTMLElement;
        this.playAgainButton = document.getElementById(playAgainButtonId) as HTMLButtonElement;
        this.mainMenuButton = document.getElementById(mainMenuButtonId) as HTMLButtonElement;

        // Assign callbacks
        this.onGameEndCallback = onGameEndCallback;
        this.navigateToScreenCallback = navigateToScreenCallback;

        // Initialize game state
        this.board = Array(9).fill(null);
        this.currentPlayer = this.player1Symbol; // 'X' always starts
        this.gameActive = false;

        this.setupEventListeners();
    }

    /**
     * Sets up event listeners for board clicks and game over buttons.
     */
    private setupEventListeners(): void {
        // Listen for clicks on the game board (event delegation)
        if (this.gameBoardElement) {
            this.gameBoardElement.addEventListener('click', this.handleCellClick.bind(this));
        }
        // Listen for "Play Again" button click
        if (this.playAgainButton) {
            this.playAgainButton.addEventListener('click', () => {
                this.hideGameOverScreen(); // Hide game over screen
                this.navigateToScreenCallback('ticTacToeSetupScreen'); // Go back to setup for a new game
            });
        }
        if (this.mainMenuButton) {
            this.mainMenuButton.addEventListener('click', () => {
                this.hideGameOverScreen(); // Hide game over screen
                this.navigateToScreenCallback('initialChoiceScreen'); // Navigate to main menu
            });
        }
    }

    /**
     * Initializes a new Tic-Tac-Toe game with given player names.
     * @param player1Name Name of Player 1 (Cross).
     * @param player2Name Name of Player 2 (Circle).
     */
    public initializeGame(player1Name: string, player2Name: string): void {
        this.player1Name = player1Name;
        this.player2Name = player2Name;
        this.board = Array(9).fill(null); // Reset board
        this.currentPlayer = this.player1Symbol; // Reset current player to 'X'
        this.gameActive = true; // Set game to active
        this.renderBoard(); // Draw the empty board
        this.updateGameMessage(`${this.player1Name}'s turn (${this.player1Symbol})`); // Update message
        this.hideGameOverScreen(); // Ensure game over screen is hidden
        // The main.ts will handle showing ticTacToeGameScreen after this initialization
    }

    /**
     * Handles a click event on a Tic-Tac-Toe cell.
     * @param event The click event.
     */
    private handleCellClick(event: Event): void {
        const target = event.target as HTMLElement;
        // Check if the clicked element is a game cell and if the game is active
        if (!target.classList.contains('tic-tac-toe-cell') || !this.gameActive) {
            return;
        }

        const index = parseInt(target.dataset.index || '-1'); // Get cell index from data-index attribute
        // Check for valid index and if the cell is already taken
        if (index === -1 || this.board[index] !== null) {
            return;
        }

        this.makeMove(index); // Process the move
    }

    /**
     * Makes a move on the board at the given index.
     * @param index The index of the cell where the move is made (0-8).
     */
    private makeMove(index: number): void {
        this.board[index] = this.currentPlayer; // Place current player's symbol on the board
        this.renderBoard(); // Update the visual board

        if (this.checkWin()) {
            // If there's a winner
            this.gameActive = false; // Deactivate game
            const winnerName = this.currentPlayer === this.player1Symbol ? this.player1Name : this.player2Name;
            this.updateGameMessage(`${winnerName} wins!`); // Update in-game message
            this.onGameEndCallback(winnerName); // Notify main app
            this.showGameOverScreen(`${winnerName} has won!`); // Show game over screen
        } else if (this.checkDraw()) {
            // If it's a draw
            this.gameActive = false; // Deactivate game
            this.updateGameMessage("It's a draw!"); // Update in-game message
            this.onGameEndCallback(null); // Notify main app (null for draw)
            this.showGameOverScreen("It's a draw!"); // Show game over screen
        } else {
            // If game continues, switch player
            this.currentPlayer = this.currentPlayer === this.player1Symbol ? this.player2Symbol : this.player1Symbol;
            const nextPlayerName = this.currentPlayer === this.player1Symbol ? this.player1Name : this.player2Name;
            this.updateGameMessage(`${nextPlayerName}'s turn (${this.currentPlayer})`); // Update message for next turn
        }
    }

    /**
     * Checks if the current player has won the game.
     * @returns True if the current player has won, false otherwise.
     */
    private checkWin(): boolean {
        // All possible winning combinations (rows, columns, diagonals)
        const winCombinations = [
            [0, 1, 2], [3, 4, 5], [6, 7, 8], // Rows
            [0, 3, 6], [1, 4, 7], [2, 5, 8], // Columns
            [0, 4, 8], [2, 4, 6]             // Diagonals
        ];

        // Check if any combination has the current player's symbol in all three positions
        return winCombinations.some(combination => {
            const [a, b, c] = combination;
            return this.board[a] !== null &&
                   this.board[a] === this.board[b] &&
                   this.board[a] === this.board[c];
        });
    }

    /**
     * Checks if the game is a draw (board is full and no winner).
     * @returns True if the game is a draw, false otherwise.
     */
    private checkDraw(): boolean {
        // A draw occurs if all cells are filled and there is no winner
        return this.board.every(cell => cell !== null);
    }

    /**
     * Renders or updates the Tic-Tac-Toe board in the DOM.
     */
    private renderBoard(): void {
        this.gameBoardElement.innerHTML = ''; // Clear previous cells
        // Create and append 9 cells to the board element
        this.board.forEach((cell, index) => {
            const cellDiv = document.createElement('div');
            cellDiv.classList.add('tic-tac-toe-cell'); // Add base class
            cellDiv.dataset.index = index.toString(); // Store index for click handling
            cellDiv.textContent = cell; // Display 'X', 'O', or empty
            if (cell === 'X') {
                cellDiv.classList.add('cross'); // Add class for styling 'X'
            } else if (cell === 'O') {
                cellDiv.classList.add('circle'); // Add class for styling 'O'
            }
            this.gameBoardElement.appendChild(cellDiv);
        });
    }

    /**
     * Updates the text content of the game message element.
     * @param message The message to display.
     */
    private updateGameMessage(message: string): void {
        if (this.gameMessageElement) {
            this.gameMessageElement.textContent = message;
        }
    }

    /**
     * Shows the game over screen with the specified message and hides the game board.
     * @param message The message to display on the game over screen.
     */
    private showGameOverScreen(message: string): void {
        if (this.gameOverScreen && this.gameOverMessageElement) {
            this.gameOverMessageElement.textContent = message;
            this.gameOverScreen.style.display = 'flex'; // Show game over screen (flex for centering)
            this.gameBoardElement.style.display = 'none'; // Hide the game board
            this.gameMessageElement.style.display = 'none'; // Hide the in-game message
        }
    }

    /**
     * Hides the game over screen and shows the game board and message.
     */
    private hideGameOverScreen(): void {
        if (this.gameOverScreen) {
            this.gameOverScreen.style.display = 'none';
        }
        if (this.gameBoardElement) {
            this.gameBoardElement.style.display = 'grid'; // Show the game board (using grid for layout)
        }
        if (this.gameMessageElement) {
            this.gameMessageElement.style.display = 'block'; // Show the in-game message
        }
    }
}