// src/tictactoe.ts

/**
 * Manages the Tic-Tac-Toe game logic and rendering.
 */
export class TicTacToe {
    private board: (string | null)[]; // Represents the 3x3 game board. Each element is 'X', 'O', or null (empty).
    private currentPlayer: string; // Stores whose turn it is: 'X' or 'O'.
    private gameActive: boolean; // A boolean flag indicating if the current game is in progress.
    private player1Name!: string; // The name of Player 1, who always plays as 'X'. The `!` indicates it will be initialized later.
    private player2Name!: string; // The name of Player 2, who always plays as 'O'. The `!` indicates it will be initialized later.
    private player1Symbol: string = 'X'; // The symbol for Player 1.
    private player2Symbol: string = 'O'; // The symbol for Player 2.

    // --- DOM Elements ---
    private gameBoardElement: HTMLElement; // The HTML element that serves as the container for the Tic-Tac-Toe cells (the 3x3 grid).
    private gameMessageElement: HTMLElement; // The HTML element used to display messages like "Player X's turn" or "It's a draw!".
    private gameOverScreen: HTMLElement; // The HTML element representing the full-screen overlay shown when the game ends.
    private gameOverMessageElement: HTMLElement; // The HTML element within the game over screen that displays the final outcome (winner or draw).
    private playAgainButton: HTMLButtonElement; // The button on the game over screen to start another Tic-Tac-Toe game.
    private mainMenuButton: HTMLButtonElement; // The button on the game over screen to return to the application's main menu.

    // --- Callbacks to the Main Application ---
    // These functions are provided by `main.ts` to allow the TicTacToe class
    // to communicate game events (like game end) and request screen navigation.
    private onGameEndCallback: (winnerName: string | null) => void; // Callback invoked when the game concludes, passing the winner's name (or null for a draw).
    private navigateToScreenCallback: (screenId: string) => void; // Callback to request navigation to a different screen (e.g., setup, main menu).

    /**
     * Constructs a new TicTacToe game instance.
     * Initializes DOM element references, sets up initial game state, and attaches event listeners.
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
        // Get references to DOM elements using their provided IDs.
        this.gameBoardElement = document.getElementById(gameBoardId) as HTMLElement;
        this.gameMessageElement = document.getElementById(gameMessageId) as HTMLElement;
        this.gameOverScreen = document.getElementById(gameOverScreenId) as HTMLElement;
        this.gameOverMessageElement = document.getElementById(gameOverMessageId) as HTMLElement;
        this.playAgainButton = document.getElementById(playAgainButtonId) as HTMLButtonElement;
        this.mainMenuButton = document.getElementById(mainMenuButtonId) as HTMLButtonElement;

        // Assign the provided callback functions.
        this.onGameEndCallback = onGameEndCallback;
        this.navigateToScreenCallback = navigateToScreenCallback;

        // Initialize the core game state.
        this.board = Array(9).fill(null); // Create an array of 9 nulls for an empty 3x3 board.
        this.currentPlayer = this.player1Symbol; // 'X' is always the starting player.
        this.gameActive = false; // Game is not active until `initializeGame` is called.

        this.setupEventListeners(); // Attach event handlers to UI elements.
    }

    /**
     * Sets up event listeners for board cell clicks and the "Play Again" and "Main Menu" buttons.
     */
    private setupEventListeners(): void {
        // Event delegation for clicks on the game board:
        // A single listener on the parent `gameBoardElement` catches clicks on any of its cells.
        if (this.gameBoardElement) {
            this.gameBoardElement.addEventListener('click', this.handleCellClick.bind(this)); // `bind(this)` ensures `this` context is correct.
        }
        // Event listener for the "Play Again" button:
        // Hides the game over screen and navigates back to the Tic-Tac-Toe setup screen.
        if (this.playAgainButton) {
            this.playAgainButton.addEventListener('click', () => {
                this.hideGameOverScreen();
                this.navigateToScreenCallback('ticTacToeSetupScreen');
            });
        }
        // Event listener for the "Main Menu" button:
        // Hides the game over screen and navigates back to the application's initial choice screen.
        if (this.mainMenuButton) {
            this.mainMenuButton.addEventListener('click', () => {
                this.hideGameOverScreen();

            if (this.gameBoardElement) {
                this.gameBoardElement.style.display = 'none'; // Show the game board, assuming its layout is `grid`.
            }
            if (this.gameMessageElement) {
                this.gameMessageElement.style.display = 'none'; // Show the in-game message area.
            }
                this.navigateToScreenCallback('initialChoiceScreen');
            });
        }
    }

    /**
     * Initializes a new Tic-Tac-Toe game.
     * This method is called from `main.ts` after player names are entered.
     * It resets the board, sets the starting player, and updates the UI.
     * @param player1Name Name of Player 1 (who plays as 'X').
     * @param player2Name Name of Player 2 (who plays as 'O').
     */
    public initializeGame(player1Name: string, player2Name: string): void {
        this.player1Name = player1Name; // Store Player 1's name.
        this.player2Name = player2Name; // Store Player 2's name.
        this.board = Array(9).fill(null); // Reset the internal game board to all empty cells.
        this.currentPlayer = this.player1Symbol; // Always set 'X' as the starting player for a new game.
        this.gameActive = true; // Set the game state to active.
        this.renderBoard(); // Render (draw) the now empty board in the DOM.
        this.updateGameMessage(`${this.player1Name}'s turn (${this.player1Symbol})`); // Display the initial turn message.
        this.hideGameOverScreen(); // Ensure the game over screen is hidden when a new game starts.
        // Note: The `main.ts` module is responsible for showing `ticTacToeGameScreen` after this initialization.
    }

    /**
     * Handles a click event on a Tic-Tac-Toe cell.
     * It determines which cell was clicked and if the move is valid before processing it.
     * @param event The DOM click event object.
     */
    private handleCellClick(event: Event): void {
        const target = event.target as HTMLElement; // Cast the event target to an HTMLElement.
        // Check if the clicked element is actually a game cell and if the game is currently active.
        if (!target.classList.contains('tic-tac-toe-cell') || !this.gameActive) {
            return; // If not a cell or game not active, ignore the click.
        }

        const index = parseInt(target.dataset.index || '-1'); // Get the cell's index from its `data-index` attribute.
        // Check for a valid index (0-8) and if the cell is already taken (not null).
        if (index === -1 || this.board[index] !== null) {
            return; // If invalid index or cell already occupied, ignore the click.
        }

        this.makeMove(index); // If the click is valid, proceed to make the move.
    }

    /**
     * Processes a player's move on the board at the given index.
     * Updates the board, checks for win/draw conditions, and switches players if the game continues.
     * @param index The 0-based index of the cell where the move is to be made.
     */
    private makeMove(index: number): void {
        this.board[index] = this.currentPlayer; // Place the current player's symbol ('X' or 'O') on the internal board array.
        this.renderBoard(); // Update the visual representation of the board in the DOM.

        if (this.checkWin()) {
            // If the current player has won:
            this.gameActive = false; // Set game to inactive.
            const winnerName = this.currentPlayer === this.player1Symbol ? this.player1Name : this.player2Name; // Determine winner's name.
            this.updateGameMessage(`${winnerName} wins!`); // Display winner message in-game.
            this.onGameEndCallback(winnerName); // Notify the main application about the winner.
            this.showGameOverScreen(`${winnerName} has won!`); // Show the dedicated game over screen with the winner.
        } else if (this.checkDraw()) {
            // If it's a draw (no winner and board is full):
            this.gameActive = false; // Set game to inactive.
            this.updateGameMessage("It's a draw!"); // Display draw message in-game.
            this.onGameEndCallback(null); // Notify the main application about a draw (passing null for winner).
            this.showGameOverScreen("It's a draw!"); // Show the dedicated game over screen for a draw.
        } else {
            // If the game continues (no win or draw):
            // Switch to the next player.
            this.currentPlayer = this.currentPlayer === this.player1Symbol ? this.player2Symbol : this.player1Symbol;
            const nextPlayerName = this.currentPlayer === this.player1Symbol ? this.player1Name : this.player2Name;
            this.updateGameMessage(`${nextPlayerName}'s turn (${this.currentPlayer})`); // Update the in-game message for the next turn.
        }
    }

    /**
     * Checks if the current player has achieved a winning combination.
     * It iterates through all predefined winning lines (rows, columns, diagonals).
     * @returns True if the current player has won, false otherwise.
     */
    private checkWin(): boolean {
        // Define all 8 possible winning combinations on a 3x3 board.
        const winCombinations = [
            [0, 1, 2], [3, 4, 5], [6, 7, 8], // Horizontal rows
            [0, 3, 6], [1, 4, 7], [2, 5, 8], // Vertical columns
            [0, 4, 8], [2, 4, 6]             // Diagonals
        ];

        // Use `some` to check if any combination meets the win criteria.
        return winCombinations.some(combination => {
            const [a, b, c] = combination; // Destructure the current combination's indices.
            // A win occurs if all three cells in the combination are not empty (null)
            // AND they all contain the same symbol (belonging to the current player).
            return this.board[a] !== null &&
                   this.board[a] === this.board[b] &&
                   this.board[a] === this.board[c];
        });
    }

    /**
     * Checks if the game has ended in a draw.
     * A draw occurs if the board is completely full (no null cells) and no player has won.
     * @returns True if the game is a draw, false otherwise.
     */
    private checkDraw(): boolean {
        // `every` checks if all cells in the board array are not null (i.e., all cells are filled).
        return this.board.every(cell => cell !== null);
    }

    /**
     * Renders or updates the Tic-Tac-Toe board in the DOM.
     * It clears the existing board elements and then recreates them based on the `this.board` array.
     */
    private renderBoard(): void {
        this.gameBoardElement.innerHTML = ''; // Clear all existing child elements from the board container.
        // Iterate through the internal `board` array to create and append a div for each cell.
        this.board.forEach((cell, index) => {
            const cellDiv = document.createElement('div');
            cellDiv.classList.add('tic-tac-toe-cell'); // Add a common class for styling.
            cellDiv.dataset.index = index.toString(); // Store the cell's index as a data attribute for event handling.
            cellDiv.textContent = cell; // Set the cell's text content to 'X', 'O', or empty (if null).

            // Add specific classes for 'X' and 'O' symbols for distinct styling (e.g., color, font).
            if (cell === 'X') {
                cellDiv.classList.add('cross');
            } else if (cell === 'O') {
                cellDiv.classList.add('circle');
            }
            this.gameBoardElement.appendChild(cellDiv); // Append the newly created cell div to the board container.
        });
    }

    /**
     * Updates the text content of the HTML element designated for game messages.
     * @param message The string message to display to the user (e.g., current turn, game outcome).
     */
    private updateGameMessage(message: string): void {
        if (this.gameMessageElement) {
            this.gameMessageElement.textContent = message;
        }
    }

    /**
     * Shows the game over screen with a specified message.
     * This also hides the main game board and in-game message.
     * @param message The message to display on the game over screen (e.g., "Player X has won!", "It's a draw!").
     */
    private showGameOverScreen(message: string): void {
        if (this.gameOverScreen && this.gameOverMessageElement) {
            this.gameOverMessageElement.textContent = message; // Set the message text.
            this.gameOverScreen.style.display = 'flex'; // Display the game over screen using flexbox for centering.
            this.gameBoardElement.style.display = 'none'; // Hide the main game board.
            this.gameMessageElement.style.display = 'none'; // Hide the in-game message area.
        }
    }

    /**
     * Hides the game over screen and brings back the game board and in-game message.
     * This is typically called when starting a new game or returning to setup.
     */
    private hideGameOverScreen(): void {
        if (this.gameOverScreen) {
            this.gameOverScreen.style.display = 'none'; // Hide the game over screen.
        }
        if (this.gameBoardElement) {
            this.gameBoardElement.style.display = 'grid'; // Show the game board, assuming its layout is `grid`.
        }
        if (this.gameMessageElement) {
            this.gameMessageElement.style.display = 'block'; // Show the in-game message area.
        }
    }
}