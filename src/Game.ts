// src/Game.ts

// Import necessary classes for Paddle and Ball, and interfaces for game configurations.
import { Paddle } from './Paddle';
import { Ball } from './Ball';
import { PlayerConfig, MatchSettings, FourPlayerMatchSettings } from './interfaces';

/**
 * The main Game class responsible for managing the Pong game logic,
 * rendering, input handling, AI, and collision detection.
 */
export class Game {
    private canvasElement: HTMLCanvasElement; // The HTML canvas element for rendering the game.
    private ctx: CanvasRenderingContext2D; // The 2D rendering context of the canvas.
    private ball!: Ball; // The game ball instance. `!` asserts that it will be initialized.
    private gameLoopId: number | null = null; // Stores the requestAnimationFrame ID for the game loop, allowing it to be cancelled.
    private iterations: number = 0; // Counter for game loop iterations, used for initial delay.

    // --- Game Mode and Player/Team Structures ---
    private gameMode: '2player' | '4player' | 'tournament' | null = null; // Current game mode: 1v1, 2v2, or tournament match.
    private scoreLimit: number = 0; // The score required to win the current match.

    // For 2-player modes (1v1 single match, 1v1 tournament match)
    public player1Paddle!: Paddle; // Represents Player A's paddle (left side). `!` asserts initialization.
    public player2Paddle!: Paddle; // Represents Player B's paddle (right side). `!` asserts initialization.
    private playerAConfig!: PlayerConfig; // Configuration for Player A (left side). `!` asserts initialization.
    private playerBConfig!: PlayerConfig; // Configuration for Player B (right side). `!` asserts initialization.
    private lastSingleMatchSettings: MatchSettings | null = null; // Stores settings for the last 1v1 match played, for "Play Again".

    // For 4-player mode (2v2 single match)
    private team1Paddles: Paddle[] = []; // Array holding paddles for Team 1 (left side: [TopLeft, BottomLeft]).
    private team2Paddles: Paddle[] = []; // Array holding paddles for Team 2 (right side: [TopRight, BottomRight]).
    private team1Score: number = 0; // Current score for Team 1.
    private team2Score: number = 0; // Current score for Team 2.
    private activePlayers: PlayerConfig[] = []; // Stores all active player configurations for the current game mode.
    private team1PlayerAConfig!: PlayerConfig; // Config for Team 1, Player A. `!` asserts initialization.
    private team1PlayerBConfig!: PlayerConfig; // Config for Team 1, Player B. `!` asserts initialization.
    private team2PlayerAConfig!: PlayerConfig; // Config for Team 2, Player A. `!` asserts initialization.
    private team2PlayerBConfig!: PlayerConfig; // Config for Team 2, Player B. `!` asserts initialization.
    private lastFourPlayerMatchSettings: FourPlayerMatchSettings | null = null; // Stores settings for the last 2v2 match, for "Play Again".

    // --- Game Constants ---
    private readonly PADDLE_WIDTH = 15; // Width of the paddles in pixels.
    private readonly PADDLE_HEIGHT_NORMAL = 100; // Standard height for paddles in 1v1 mode.
    private readonly PADDLE_HEIGHT_FOUR_PLAYER = 75; // Shorter height for paddles in 2v2 mode.
    private readonly BALL_RADIUS = 8; // Radius of the ball in pixels.
    private readonly PADDLE_SPEED = 7; // Base movement speed for paddles (also used as AI's base speed).

    private keysPressed: { [key: string]: boolean } = {}; // Object to track currently pressed keyboard keys (only for human input).
    private gameOver: boolean = false; // Flag to indicate if the current match has ended.
    private winnerMessage: string = ""; // Message to display when the match ends (e.g., "Player X wins!").

    // --- UI elements for Match Over Screen ---
    private singleMatchOverScreenDiv: HTMLElement; // The div element for the "match over" screen.
    private singleMatchOverMessageElement: HTMLElement; // Element to display the winner message on the "match over" screen.
    private singleMatchPlayAgainButton: HTMLButtonElement; // Button to restart a single match.
    private singleMatchOverButtonsDiv: HTMLElement; // Container for buttons specific to single matches (e.g., Play Again, Main Menu).
    private tournamentMatchOverButtonsDiv: HTMLElement; // Container for buttons specific to tournament matches (e.g., Next Match).

    // --- For Tournament Play ---
    private isTournamentMatchFlag: boolean = false; // Flag indicating if the current match is part of a tournament.
    private onMatchCompleteCallback: ((winner: PlayerConfig) => void) | null = null; // Callback function called when a tournament match ends, to inform the Tournament manager.

    // --- AI specific properties ---
    private lastAIUpdateTime: number = 0; // Timestamp of the last AI decision update.
    private readonly AI_UPDATE_INTERVAL_MS = 1000; // MANDATORY: AI updates its target only once per second to make it less perfect.
    private readonly AI_PERFECTION_OFFSET = 15; // Offset for AI aiming imperfection (higher = easier, lower = harder/more perfect).

    /**
     * Constructs a new Game instance.
     * @param canvasId The ID of the HTML canvas element.
     * @param matchOverScreenId The ID of the HTML div for the match over screen.
     * @param matchOverMessageId The ID of the HTML element for the match over message.
     * @param singleMatchPlayAgainBtnId The ID of the HTML button to play again (single match).
     * @param singleMatchOverButtonsId The ID of the HTML div containing single match over buttons.
     * @param tournamentMatchOverButtonsId The ID of the HTML div containing tournament match over buttons.
     */
    constructor(
        canvasId: string,
        matchOverScreenId: string,
        matchOverMessageId: string,
        singleMatchPlayAgainBtnId: string,
        singleMatchOverButtonsId: string,
        tournamentMatchOverButtonsId: string
    ) {
        // Get references to HTML elements and assert their existence.
        this.canvasElement = document.getElementById(canvasId) as HTMLCanvasElement;
        if (!this.canvasElement) throw new Error(`Canvas element with ID '${canvasId}' not found.`);
        this.ctx = this.canvasElement.getContext('2d')!;
        if (!this.ctx) throw new Error('Failed to get 2D rendering context.');

        // Get references to match over UI elements.
        this.singleMatchOverScreenDiv = document.getElementById(matchOverScreenId) as HTMLElement;
        this.singleMatchOverMessageElement = document.getElementById(matchOverMessageId) as HTMLElement;
        this.singleMatchPlayAgainButton = document.getElementById(singleMatchPlayAgainBtnId) as HTMLButtonElement;
        this.singleMatchOverButtonsDiv = document.getElementById(singleMatchOverButtonsId) as HTMLElement;
        this.tournamentMatchOverButtonsDiv = document.getElementById(tournamentMatchOverButtonsId) as HTMLElement;

        // Attach event listener to the "Play Again" button for single matches.
        if (this.singleMatchPlayAgainButton) {
            this.singleMatchPlayAgainButton.onclick = () => this.handlePlayAgain();
        }
    }

    // Method to stop the game.
    public stop(): void {
        if (this.gameLoopId) {
            cancelAnimationFrame(this.gameLoopId);
            this.gameLoopId = null;
        }
        this.gameOver = true; // Ensure the game is marked as over
        this.hideElement(this.canvasElement); // Hide the canvas
    }

    /**
     * Shows a given HTML element by setting its display style.
     * @param element The HTMLElement to show.
     * @param displayType The CSS display property value (e.g., 'block', 'flex'). Defaults to 'block'.
     */
    private showElement(element: HTMLElement, displayType: string = 'block'): void {
        if (element) element.style.display = displayType;
    }

    /**
     * Hides a given HTML element by setting its display style to 'none'.
     * @param element The HTMLElement to hide.
     */
    private hideElement(element: HTMLElement): void {
        if (element) element.style.display = 'none';
    }

    /**
     * Handles the "Play Again" button click for single matches.
     * Hides the match over screen, shows the canvas, re-initializes, and starts the game.
     */
    private handlePlayAgain(): void {
        if (this.singleMatchOverScreenDiv) this.hideElement(this.singleMatchOverScreenDiv);
        if (this.canvasElement) this.showElement(this.canvasElement);

        // Re-initialize the game based on the last played mode and settings.
        if ((this.gameMode === '2player' || this.gameMode === 'tournament') && this.lastSingleMatchSettings) {
            this.initializeGame(this.lastSingleMatchSettings, this.isTournamentMatchFlag, this.onMatchCompleteCallback);
            this.start();
        } else if (this.gameMode === '4player' && this.lastFourPlayerMatchSettings) {
            this.initializeFourPlayerMatch(this.lastFourPlayerMatchSettings);
            this.start();
        } else {
            console.error("Cannot play again: last match settings not available or game mode unclear.", this.gameMode);
            alert("Error restarting game. Please return to main menu."); // Inform user if restart fails.
        }
    }

    /**
     * Initializes the game for 1v1 matches (either single or part of a tournament).
     * Sets up paddles, ball, and other game state based on provided settings.
     * @param settings Match settings including player configurations and score limit.
     * @param isTournament True if this match is part of a tournament, false otherwise.
     * @param onCompleteCallback A callback function to be invoked when the match completes (only for tournament matches).
     */
    public initializeGame(
        settings: MatchSettings,
        isTournament: boolean,
        onCompleteCallback: ((winner: PlayerConfig) => void) | null
    ): void {
        // Set game mode and tournament flags.
        this.gameMode = isTournament ? 'tournament' : '2player';
        this.isTournamentMatchFlag = isTournament;
        this.onMatchCompleteCallback = onCompleteCallback;

        /* ... -> for object cloning */
        // Store player configurations and score limit.
        this.playerAConfig = { ...settings.playerA };
        this.playerBConfig = { ...settings.playerB };
        this.activePlayers = [this.playerAConfig, this.playerBConfig]; // Track active players for AI/input.
        this.scoreLimit = settings.scoreLimit;

        // Save settings for "Play Again" functionality (only for non-tournament 1v1).
        if (!isTournament) {
            this.lastSingleMatchSettings = { ...settings };
        }
        this.lastFourPlayerMatchSettings = null; // Clear 4-player settings.

        // Set canvas dimensions.
        this.canvasElement.width = 800;
        this.canvasElement.height = 600;

        // Initialize 1v1 paddles.
        this.player1Paddle = new Paddle(30, this.canvasElement.height / 2 - this.PADDLE_HEIGHT_NORMAL / 2, this.PADDLE_WIDTH, this.PADDLE_HEIGHT_NORMAL, this.playerAConfig.color, this.PADDLE_SPEED, this.playerAConfig.name);
        this.player2Paddle = new Paddle(this.canvasElement.width - 30 - this.PADDLE_WIDTH, this.canvasElement.height / 2 - this.PADDLE_HEIGHT_NORMAL / 2, this.PADDLE_WIDTH, this.PADDLE_HEIGHT_NORMAL, this.playerBConfig.color, this.PADDLE_SPEED, this.playerBConfig.name);

        // Clear 4-player paddles and scores if previously used.
        this.team1Paddles = [];
        this.team2Paddles = [];
        this.team1Score = 0;
        this.team2Score = 0;

        // Initialize the ball.
        this.ball = new Ball(this.canvasElement.width / 2, this.canvasElement.height / 2, this.BALL_RADIUS, '#FFF');
        this.setupInput(); // Set up keyboard input listeners.
        this.resetGameInternals(); // Reset core game state (scores, paddle positions, ball position).
    }

    /**
     * Initializes the game for a 4-player (2v2) match.
     * Sets up four paddles, ball, and other game state based on provided settings.
     * @param settings Four-player match settings including team player configurations and score limit.
     */
    public initializeFourPlayerMatch(settings: FourPlayerMatchSettings): void {
        // Set game mode and clear tournament flags.
        this.gameMode = '4player';
        this.isTournamentMatchFlag = false;
        this.onMatchCompleteCallback = null;

        // Store player configurations for each team member.
        this.team1PlayerAConfig = { ...settings.team1PlayerA };
        this.team1PlayerBConfig = { ...settings.team1PlayerB };
        this.team2PlayerAConfig = { ...settings.team2PlayerA };
        this.team2PlayerBConfig = { ...settings.team2PlayerB };
        this.activePlayers = [this.team1PlayerAConfig, this.team1PlayerBConfig, this.team2PlayerAConfig, this.team2PlayerBConfig];
        this.scoreLimit = settings.scoreLimit;
        this.lastFourPlayerMatchSettings = { ...settings }; // Save settings for "Play Again".
        this.lastSingleMatchSettings = null; // Clear 1v1 settings.

        // Set canvas dimensions.
        this.canvasElement.width = 800;
        this.canvasElement.height = 600;

        const paddleHeight = this.PADDLE_HEIGHT_FOUR_PLAYER;
        // Calculate Y positions for top and bottom paddles on each side.
        const topY = this.canvasElement.height / 4 - paddleHeight / 2;
        const bottomY = (3 * this.canvasElement.height) / 4 - paddleHeight / 2;

        // Initialize paddles for Team 1 (left side).
        this.team1Paddles = [
            new Paddle(30, topY, this.PADDLE_WIDTH, paddleHeight, settings.team1PlayerA.color, this.PADDLE_SPEED, settings.team1PlayerA.name),
            new Paddle(30, bottomY, this.PADDLE_WIDTH, paddleHeight, settings.team1PlayerB.color, this.PADDLE_SPEED, settings.team1PlayerB.name)
        ];
        // Initialize paddles for Team 2 (right side).
        this.team2Paddles = [
            new Paddle(this.canvasElement.width - 30 - this.PADDLE_WIDTH, topY, this.PADDLE_WIDTH, paddleHeight, settings.team2PlayerA.color, this.PADDLE_SPEED, settings.team2PlayerA.name),
            new Paddle(this.canvasElement.width - 30 - this.PADDLE_WIDTH, bottomY, this.PADDLE_WIDTH, paddleHeight, settings.team2PlayerB.color, this.PADDLE_SPEED, settings.team2PlayerB.name)
        ];
        
        // Explicitly clear 1v1 paddles in case they were initialized from a previous game mode.
        this.player1Paddle = null as any;
        this.player2Paddle = null as any;

        // Reset team scores.
        this.team1Score = 0;
        this.team2Score = 0;

        // Initialize the ball.
        this.ball = new Ball(this.canvasElement.width / 2, this.canvasElement.height / 2, this.BALL_RADIUS, '#FFF');
        this.setupInput(); // Set up keyboard input listeners.
        this.resetGameInternals(); // Reset core game state.
    }

    /**
     * Sets up keyboard event listeners for player input.
     * Clears previous listeners to prevent multiple bindings.
     */
    private setupInput(): void {
        // Remove existing listeners to avoid duplicates.
        window.onkeydown = null;
        window.onkeyup = null;
        this.keysPressed = {}; // Clear any lingering key presses.

        // Add new listeners for keydown (key pressed) and keyup (key released).
        window.addEventListener('keydown', (event) => {
            if (!this.gameOver) this.keysPressed[event.key.toUpperCase()] = true; // Store key as pressed if game is not over.
        });
        window.addEventListener('keyup', (event) => {
            this.keysPressed[event.key.toUpperCase()] = false; // Mark key as released.
        });
    }

    /**
     * Processes human player input to move paddles based on `keysPressed` state.
     * This method only handles human-controlled paddles; AI is handled separately.
     */
    private handlePlayerInput(): void {
        if (this.gameOver) return; // Do nothing if game is over.

        if (this.gameMode === '4player') {
            // --- Team 1 (Left Side) Human Input ---
            // Player A (top-left) controls.
            //'?' -> property before might be null or undefined
            if (this.team1PlayerAConfig?.type === 'human' && this.team1Paddles[0]) {
                if (this.keysPressed['A']) this.team1Paddles[0].moveUp();
                if (this.keysPressed['Q']) this.team1Paddles[0].moveDown(this.canvasElement.height);
            }
            // Player B (bottom-left) controls.
            if (this.team1PlayerBConfig?.type === 'human' && this.team1Paddles[1]) {
                if (this.keysPressed['Z']) this.team1Paddles[1].moveUp();
                if (this.keysPressed['S']) this.team1Paddles[1].moveDown(this.canvasElement.height);
            }
            // --- Team 2 (Right Side) Human Input ---
            // Player A (top-right) controls.
            if (this.team2PlayerAConfig?.type === 'human' && this.team2Paddles[0]) {
                if (this.keysPressed['P']) this.team2Paddles[0].moveUp();
                if (this.keysPressed['M']) this.team2Paddles[0].moveDown(this.canvasElement.height);
            }
            // Player B (bottom-right) controls.
            if (this.team2PlayerBConfig?.type === 'human' && this.team2Paddles[1]) {
                if (this.keysPressed['O']) this.team2Paddles[1].moveUp();
                if (this.keysPressed['L']) this.team2Paddles[1].moveDown(this.canvasElement.height);
            }
        } else { // Handles 2-player (1v1) or tournament mode human input.
            // Player A (left) controls.
            if (this.playerAConfig?.type === 'human' && this.player1Paddle) {
                if (this.keysPressed['A']) this.player1Paddle.moveUp();
                if (this.keysPressed['Q']) this.player1Paddle.moveDown(this.canvasElement.height);
            }
            // Player B (right) controls.
            if (this.playerBConfig?.type === 'human' && this.player2Paddle) {
                if (this.keysPressed['P']) this.player2Paddle.moveUp();
                if (this.keysPressed['M']) this.player2Paddle.moveDown(this.canvasElement.height);
            }
        }
    }

    /**
     * Simulates the ball's trajectory to predict its Y position when it reaches a specific X coordinate.
     * This is a simplified prediction, primarily for AI, assuming reflections off top/bottom walls.
     * It does NOT account for reflections off opponent paddles or complex game states.
     * @param startX Initial X position of the ball.
     * @param startY Initial Y position of the ball.
     * @param initialSpeedX Ball's horizontal speed at the start of prediction.
     * @param initialSpeedY Ball's vertical speed at the start of prediction.
     * @param targetX The X coordinate at which to predict the ball's Y position (typically a paddle's X-coordinate).
     * @param canvasWidth The width of the canvas, for boundary checks.
     * @param canvasHeight The height of the canvas, for boundary checks.
     * @param ballRadius The radius of the ball, for accurate collision checks.
     * @returns The predicted Y position of the ball when it reaches `targetX`.
     */
    private predictBallYAtX(
        startX: number,
        startY: number,
        initialSpeedX: number,
        initialSpeedY: number,
        targetX: number,
        canvasWidth: number,
        canvasHeight: number,
        ballRadius: number
    ): number {
        let currentX = startX;
        let currentY = startY;
        let speedX = initialSpeedX;
        let speedY = initialSpeedY;

        // Safety break to prevent infinite loops in extreme edge cases.
        const MAX_ITERATIONS = 1000;
        let iterations = 0;

        // If ball is not moving horizontally, or already at target X, return current Y.
        if (Math.abs(speedX) < 0.1 || Math.abs(targetX - currentX) < 1) {
            return currentY;
        }

        // Determine if the ball is moving towards or away from the target X.
        const movingTowardsTarget = (speedX > 0 && targetX > currentX) || (speedX < 0 && targetX < currentX);

        // Loop to simulate ball movement until `targetX` is reached or max iterations.
        while (true && iterations < MAX_ITERATIONS) {
            iterations++;

            // Calculate the time it would take to reach `targetX`.
            const timeToTargetX = (targetX - currentX) / speedX;

            // Calculate the time it would take to hit the top or bottom walls.
            const timeToTopWall = (speedY < 0) ? (0 - (currentY - ballRadius)) / speedY : Infinity;
            const timeToBottomWall = (speedY > 0) ? (canvasHeight - (currentY + ballRadius)) / speedY : Infinity;
            
            // Determine the earliest event (hitting target X or a wall).
            const timeToNextEvent = Math.min(Math.abs(timeToTargetX), timeToTopWall, timeToBottomWall);

            // Handle cases where no valid next event time can be calculated.
            if (!isFinite(timeToNextEvent) || timeToNextEvent < 0.001) {
                return currentY; // Return current Y if prediction cannot proceed.
            }

            // Update ball's position to the point of the next event.
            currentX += speedX * timeToNextEvent;
            currentY += speedY * timeToNextEvent;

            // Check if `targetX` was reached within this simulation step.
            const epsilon = 0.5; // Small tolerance for floating-point comparisons.
            if ( (speedX > 0 && currentX >= targetX - epsilon && currentX <= targetX + epsilon) || 
                 (speedX < 0 && currentX <= targetX + epsilon && currentX >= targetX - epsilon) ) {
                return currentY; // `targetX` reached, return predicted Y.
            }

            // If a wall was hit, reflect the ball's `speedY` and adjust `currentY`.
            if (currentY - ballRadius <= 0 + epsilon && speedY < 0) { // Hit top wall.
                currentY = ballRadius; // Snap to top edge.
                speedY *= -1; // Reverse vertical speed.
            } else if (currentY + ballRadius >= canvasHeight - epsilon && speedY > 0) { // Hit bottom wall.
                currentY = canvasHeight - ballRadius; // Snap to bottom edge.
                speedY *= -1; // Reverse vertical speed.
            } else if (currentX - ballRadius <= 0 + epsilon && speedX < 0) { // Hit left wall (implies a score or reflection).
                // For prediction, if the ball goes past the goal line, we simulate a bounce
                // off an invisible wall to continue trajectory across the court.
                // A true minimax AI would handle scoring or opponent interaction here.
                 speedX *= -1; // Assume reflection.
                 currentX = ballRadius; // Snap to edge.
            } else if (currentX + ballRadius >= canvasWidth - epsilon && speedX > 0) { // Hit right wall.
                // Similar logic for right wall.
                 speedX *= -1; // Assume reflection.
                 currentX = canvasWidth - ballRadius; // Snap to edge.
            }
        }
        
        // Fallback: If max iterations are reached, return the current Y.
        // This indicates an issue or a very long trajectory.
        return currentY;
    }


    /**
     * Updates the AI-controlled paddles.
     * AI target prediction happens once per `AI_UPDATE_INTERVAL_MS`,
     * while AI movement toward that target occurs every frame.
     */
    private updateAI(): void {
        if (this.gameOver || !this.ball) return; // Do nothing if game is over or ball is not initialized.

        const currentTime = performance.now(); // Get current time for AI update interval.
        
        let paddlesToControl: Paddle[] = []; // Array to store all AI paddles.
        let isLeftPlayer: boolean[] = []; // Array to store if each AI paddle is on the left side.

        // Identify all AI-controlled paddles based on the current game mode.
        if (this.gameMode === '4player') {
            // Add Team 1 (left) AI paddles.
            if (this.team1PlayerAConfig?.type === 'ai' && this.team1Paddles[0]) {
                paddlesToControl.push(this.team1Paddles[0]);
                isLeftPlayer.push(true);
            }
            if (this.team1PlayerBConfig?.type === 'ai' && this.team1Paddles[1]) {
                paddlesToControl.push(this.team1Paddles[1]);
                isLeftPlayer.push(true);
            }
            // Add Team 2 (right) AI paddles.
            if (this.team2PlayerAConfig?.type === 'ai' && this.team2Paddles[0]) {
                paddlesToControl.push(this.team2Paddles[0]);
                isLeftPlayer.push(false);
            }
            if (this.team2PlayerBConfig?.type === 'ai' && this.team2Paddles[1]) {
                paddlesToControl.push(this.team2Paddles[1]);
                isLeftPlayer.push(false);
            }
        } else { // 2-player or tournament mode.
            // Add Player A (left) AI paddle.
            if (this.playerAConfig?.type === 'ai' && this.player1Paddle) {
                paddlesToControl.push(this.player1Paddle);
                isLeftPlayer.push(true);
            }
            // Add Player B (right) AI paddle.
            if (this.playerBConfig?.type === 'ai' && this.player2Paddle) {
                paddlesToControl.push(this.player2Paddle);
                isLeftPlayer.push(false);
            }
        }

        if (paddlesToControl.length === 0) {
            return; // No AI paddles to control.
        }

        // --- AI Decision Logic (Executes only once per second) ---
        if (currentTime - this.lastAIUpdateTime >= this.AI_UPDATE_INTERVAL_MS) {
            this.lastAIUpdateTime = currentTime; // Update the last decision time.
            
            paddlesToControl.forEach((paddle, index) => {
                const isLeft = isLeftPlayer[index]; // Check if the current paddle is on the left side.
                const ballX = this.ball.x;
                const ballY = this.ball.y;
                const ballSpeedX = this.ball.speedX; 
                const ballSpeedY = this.ball.speedY; 
                
                let predictedTargetY: number;

                // AI only calculates a new prediction if the ball is on its side of the court
                // AND moving towards its goal (i.e., it's a threat to score on its side).
                const ballMovingTowardsAIsGoal = (isLeft && ballSpeedX < 0) || (!isLeft && ballSpeedX > 0);

                if (ballMovingTowardsAIsGoal) {
                    // Determine the X-coordinate of the paddle's "hitting" edge for prediction.
                    // For a left paddle, it's `paddle.x + paddle.width`. For a right paddle, it's `paddle.x`.
                    const targetPaddleX = isLeft ? paddle.x + paddle.width : paddle.x;
                    
                    // Predict the ball's Y position when it reaches the paddle's X.
                    predictedTargetY = this.predictBallYAtX(
                        ballX, ballY, ballSpeedX, ballSpeedY,
                        targetPaddleX, this.canvasElement.width, this.canvasElement.height, this.BALL_RADIUS
                    );

                    // This version clamps the *center* of the paddle's potential target Y.
                    // It assumes that paddle.setAITargetY will then position the paddle
                    // so its center is at this 'finalTargetY'.
                    let finalTargetY = Math.max(paddle.height / 2, Math.min(this.canvasElement.height - paddle.height / 2, predictedTargetY));
                    paddle.setAITargetY(finalTargetY, this.canvasElement.height);

                } else {
                    // If the ball is not a threat, or is on the other side, the AI paddle returns to the center.
                    paddle.setAITargetY(this.canvasElement.height / 2, this.canvasElement.height);
                }
            });
        }

        // --- AI Movement Application (Every frame) ---
        // Regardless of whether a new decision was made (which happens once per second),
        // the AI paddles continuously move towards their *current* stored target Y.
        paddlesToControl.forEach(paddle => {
            paddle.updateAI(this.canvasElement.height); // Call the paddle's AI update method.
        });
    }

    /**
     * Checks for collisions between the ball and paddles, or walls.
     * Delegates to specific collision methods based on the current game mode.
     */
    private checkCollision(): void {
        if (!this.ball) return;
        if (this.gameMode === '4player') {
            this.checkFourPlayerCollisions();
        } else {
            this.checkTwoPlayerCollisions();
        }
    }

    /**
     * Checks for ball collisions with paddles in 1v1 game modes and handles scoring.
     */
    private checkTwoPlayerCollisions(): void {
        if (!this.ball || !this.player1Paddle || !this.player2Paddle) return; // Ensure all necessary objects exist.
        const paddles = [this.player1Paddle, this.player2Paddle]; // Array of paddles.
        const isLeftPaddle = [true, false]; // Corresponds to whether the paddle is on the left side.

        for (let i = 0; i < paddles.length; i++) {
            const paddle = paddles[i];
            // Determine if the ball is hitting the left or right paddle's X-boundary.
            const hitLeft = isLeftPaddle[i] && this.ball.x - this.ball.radius < paddle.x + paddle.width && this.ball.x - this.ball.radius > paddle.x;
            const hitRight = !isLeftPaddle[i] && this.ball.x + this.ball.radius > paddle.x && this.ball.x + this.ball.radius < paddle.x + paddle.width;
            
            // Check for collision: ball's horizontal range overlaps paddle's, and ball's vertical range overlaps paddle's.
            if ((hitLeft || hitRight) &&
                this.ball.y + this.ball.radius > paddle.y &&
                this.ball.y - this.ball.radius < paddle.y + paddle.height) {
                
                this.ball.speedX *= -1; // Reverse horizontal speed for bounce.
                // Adjust ball's X position to prevent it from getting stuck inside the paddle.
                this.ball.x = isLeftPaddle[i] ? (paddle.x + paddle.width + this.ball.radius) : (paddle.x - this.ball.radius);
                
                // Calculate `deltaY` (distance from ball center to paddle center) to determine vertical bounce angle.
                let deltaY = this.ball.y - (paddle.y + paddle.height / 2);
                this.ball.speedY = deltaY * 0.25; // Adjust vertical speed based on where it hit the paddle.
                break; // Exit loop after first collision to prevent double bounces.
            }
        }

        // --- Scoring Logic for 1v1 ---
        // If ball goes past the left wall (into Player 1's goal).
        if (this.ball.x - this.ball.radius < 0) {
            this.player2Paddle.score++; // Player 2 scores.
            this.ball.reset(this.canvasElement.width, this.canvasElement.height); // Reset ball to center.
            this.checkWinCondition(); // Check if a player has reached the score limit.
        } 
        // If ball goes past the right wall (into Player 2's goal).
        else if (this.ball.x + this.ball.radius > this.canvasElement.width) {
            this.player1Paddle.score++; // Player 1 scores.
            this.ball.reset(this.canvasElement.width, this.canvasElement.height); // Reset ball to center.
            this.checkWinCondition(); // Check win condition.
        }
    }

    /**
     * Checks for ball collisions with paddles in 4-player (2v2) game mode and handles scoring.
     */
    private checkFourPlayerCollisions(): void {
        if (!this.ball || this.team1Paddles.length < 2 || this.team2Paddles.length < 2) return; // Ensure all necessary objects exist.
        let collisionOccurred = false; // Flag to ensure only one collision is processed per frame.

        // --- Team 1 (Left) Paddles Collision Check ---
        for (const paddle of this.team1Paddles) {
            // Collision detection with left paddles.
            if (this.ball.x - this.ball.radius < paddle.x + paddle.width &&
                this.ball.x > paddle.x && // Ensure ball is sufficiently past the front of the paddle.
                this.ball.y + this.ball.radius > paddle.y &&
                this.ball.y - this.ball.radius < paddle.y + paddle.height) {
                this.ball.speedX *= -1; // Reverse horizontal speed.
                this.ball.x = paddle.x + paddle.width + this.ball.radius; // Adjust ball position to prevent sticking.
                let deltaY = this.ball.y - (paddle.y + paddle.height / 2);
                this.ball.speedY = deltaY * 0.25;
                collisionOccurred = true;
                break; // Only process one collision.
            }
        }

        if (collisionOccurred) return; // If a collision occurred with Team 1, don't check Team 2 this frame.

        // --- Team 2 (Right) Paddles Collision Check ---
        for (const paddle of this.team2Paddles) {
            // Collision detection with right paddles.
            if (this.ball.x + this.ball.radius > paddle.x &&
                this.ball.x < paddle.x + paddle.width && // Ensure ball is sufficiently past the front.
                this.ball.y + this.ball.radius > paddle.y &&
                this.ball.y - this.ball.radius < paddle.y + paddle.height) {
                this.ball.speedX *= -1; // Reverse horizontal speed.
                this.ball.x = paddle.x - this.ball.radius; // Adjust ball position.
                let deltaY = this.ball.y - (paddle.y + paddle.height / 2);
                this.ball.speedY = deltaY * 0.25;
                collisionOccurred = true;
                break; // Only process one collision.
            }
        }
        
        if (collisionOccurred) return; // If a collision occurred with Team 2, don't proceed to scoring.

        // --- Scoring Logic for 4-player ---
        // If ball goes past the left wall (into Team 1's goal).
        if (this.ball.x - this.ball.radius < 0) {
            this.team2Score++; // Team 2 scores.
            this.ball.reset(this.canvasElement.width, this.canvasElement.height); // Reset ball.
            this.checkWinCondition(); // Check if a team has reached the score limit.
        } 
        // If ball goes past the right wall (into Team 2's goal).
        else if (this.ball.x + this.ball.radius > this.canvasElement.width) {
            this.team1Score++; // Team 1 scores.
            this.ball.reset(this.canvasElement.width, this.canvasElement.height); // Reset ball.
            this.checkWinCondition(); // Check win condition.
        }
    }

    /**
     * Checks if either player/team has reached the score limit and determines the winner.
     * Sets `gameOver` flag and `winnerMessage`, and triggers `onMatchCompleteCallback` for tournament matches.
     */
    private checkWinCondition(): void {
        if (this.gameOver) return; // If game is already over, do nothing.

        if (this.gameMode === '4player') {
            // Check win condition for 4-player mode.
            if (this.team1Score >= this.scoreLimit) {
                this.gameOver = true;
                this.winnerMessage = `Team ${this.team1PlayerAConfig.name} & ${this.team1PlayerBConfig.name} wins!`;
            } else if (this.team2Score >= this.scoreLimit) {
                this.gameOver = true;
                this.winnerMessage = `Team ${this.team2PlayerAConfig.name} & ${this.team2PlayerBConfig.name} wins!`;
            }
        } else { // Check win condition for 2-player or tournament mode.
            if (!this.player1Paddle || !this.player2Paddle || !this.playerAConfig || !this.playerBConfig) return; // Ensure paddles/configs exist.
            let winner: PlayerConfig | null = null;
            if (this.player1Paddle.score >= this.scoreLimit) {
                winner = this.playerAConfig; // Player A wins.
                this.winnerMessage = `${this.playerAConfig.name} wins the match!`;
            } else if (this.player2Paddle.score >= this.scoreLimit) {
                winner = this.playerBConfig; // Player B wins.
                this.winnerMessage = `${this.playerBConfig.name} wins the match!`;
            }
            if (winner) {
                this.gameOver = true;
                // If it's a tournament match, call the callback to notify the Tournament manager about the winner.
                if (this.isTournamentMatchFlag && this.onMatchCompleteCallback) {
                    this.onMatchCompleteCallback(winner);
                }
            }
        }

        // If game is over, trigger the `triggerMatchOver` method.
        if (this.gameOver) {
            this.triggerMatchOver();
        }
    }

    /**
     * Stops the game loop, hides the canvas, and displays the appropriate "match over" UI.
     * Behavior differs slightly for tournament vs. single matches.
     */
    private triggerMatchOver(): void {
        // Stop the game loop.
        if (this.gameLoopId) {
            cancelAnimationFrame(this.gameLoopId);
            this.gameLoopId = null;
        }
        // Hide the game canvas.
        if (this.canvasElement) this.hideElement(this.canvasElement);

        // For tournament matches, the `Tournament` class manages the "match over" UI flow,
        // so this `Game` class does not display the generic match over screen.
        if (this.isTournamentMatchFlag) {
            return;
        }
        
        // For single 1v1 or 2v2 matches:
        // Display the winner message.
        if (this.singleMatchOverMessageElement) {
            this.singleMatchOverMessageElement.textContent = this.winnerMessage;
        }
        // Hide tournament-specific buttons and show single-match specific buttons.
        if (this.tournamentMatchOverButtonsDiv) this.hideElement(this.tournamentMatchOverButtonsDiv);
        if (this.singleMatchOverButtonsDiv) this.showElement(this.singleMatchOverButtonsDiv);
        // Display the single match over screen.
        if (this.singleMatchOverScreenDiv) this.showElement(this.singleMatchOverScreenDiv, 'flex');
    }

    /**
     * Updates the game state for a single frame.
     * Includes handling player input, AI updates, ball movement, and collision detection.
     */
    private update(): void {
        if (this.gameOver) return; // Do nothing if game is over.
        this.handlePlayerInput(); // Process human player controls.
        this.updateAI();         // Update AI paddle positions based on ball.
        if (this.ball) this.ball.update(this.canvasElement.width, this.canvasElement.height); // Update ball position and handle wall bounces.
        this.checkCollision(); // Check for collisions and handle scoring.
    }

    /**
     * Draws the current scores on the canvas.
     */
    private drawScores(): void {
        this.ctx.fillStyle = '#FFF'; // Set score text color to white.
        this.ctx.font = '28px Arial'; // Set font style and size.
        this.ctx.textAlign = 'left'; // Default text alignment.

        if (this.gameMode === '4player') {
            // Display scores for 4-player mode (Team 1 vs Team 2).
            const t1Name = `Team ${this.team1PlayerAConfig?.name[0]}/${this.team1PlayerBConfig?.name[0]}`; // Abbreviated team name.
            const t2Name = `Team ${this.team2PlayerAConfig?.name[0]}/${this.team2PlayerBConfig?.name[0]}`;
            this.ctx.fillText(`${t1Name}: ${this.team1Score}`, 50, 50); // Team 1 score on left.
            this.ctx.textAlign = 'right';
            this.ctx.fillText(`${t2Name}: ${this.team2Score}`, this.canvasElement.width - 50, 50); // Team 2 score on right.
        } else if (this.player1Paddle && this.player2Paddle && this.playerAConfig && this.playerBConfig) {
            // Display scores for 2-player/tournament mode (Player A vs Player B).
            this.ctx.fillText(`${this.playerAConfig.name}: ${this.player1Paddle.score}`, 50, 50); // Player A score on left.
            this.ctx.textAlign = 'right';
            this.ctx.fillText(`${this.playerBConfig.name}: ${this.player2Paddle.score}`, this.canvasElement.width - 50, 50); // Player B score on right.
        }
        this.ctx.textAlign = 'left'; // Reset text alignment to default.
    }

    /**
     * Draws the dashed net line in the middle of the canvas.
     */
    private drawNet(): void {
        this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)'; // Net color (semi-transparent white).
        this.ctx.lineWidth = 4; // Net line width.
        this.ctx.beginPath(); // Start a new path.
        this.ctx.setLineDash([10, 10]); // Set dashed line pattern (10px dash, 10px gap).
        this.ctx.moveTo(this.canvasElement.width / 2, 0); // Move to top center.
        this.ctx.lineTo(this.canvasElement.width / 2, this.canvasElement.height); // Draw line to bottom center.
        this.ctx.stroke(); // Render the line.
        this.ctx.setLineDash([]); // Reset line dash to solid for other drawings.
    }

    /**
     * Renders all game elements on the canvas for a single frame.
     */
    private draw(): void {
        this.ctx.fillStyle = '#000'; // Set background color to black.
        this.ctx.fillRect(0, 0, this.canvasElement.width, this.canvasElement.height); // Fill the entire canvas with black.

        if (!this.gameOver) { // Only draw game elements if the game is not over.
            this.drawNet(); // Draw the middle net.
            if (this.gameMode === '4player') {
                // Draw all four paddles for 4-player mode.
                this.team1Paddles.forEach(p => p?.draw(this.ctx));
                this.team2Paddles.forEach(p => p?.draw(this.ctx));
            } else if (this.player1Paddle && this.player2Paddle) {
                // Draw two paddles for 2-player/tournament mode.
                this.player1Paddle.draw(this.ctx);
                this.player2Paddle.draw(this.ctx);
            }
            if (this.ball) this.ball.draw(this.ctx); // Draw the ball.
            this.drawScores(); // Draw the current scores.
        }
    }

    private resetGameInternals(): void {
        this.gameOver = false; // Reset game over flag.
        this.winnerMessage = ""; // Clear winner message.
        this.keysPressed = {}; // Clear any currently pressed keys.
        this.lastAIUpdateTime = 0; // Reset AI timer to allow immediate AI update in next loop.

        if (this.gameMode === '4player') {
            // Reset scores and paddle positions for 4-player mode.
            this.team1Score = 0;
            this.team2Score = 0;
            const paddleHeight = this.PADDLE_HEIGHT_FOUR_PLAYER;
            const topY = this.canvasElement.height / 4 - paddleHeight / 2;
            const bottomY = (3 * this.canvasElement.height) / 4 - paddleHeight / 2;

            // Reset each paddle's Y position and score.
            if (this.team1Paddles[0]) { this.team1Paddles[0].y = topY; this.team1Paddles[0].score = 0; }
            if (this.team1Paddles[1]) { this.team1Paddles[1].y = bottomY; this.team1Paddles[1].score = 0; }
            if (this.team2Paddles[0]) { this.team2Paddles[0].y = topY; this.team2Paddles[0].score = 0; }
            if (this.team2Paddles[1]) { this.team2Paddles[1].y = bottomY; this.team2Paddles[1].score = 0; }
        } else {
            // Reset scores and paddle positions for 2-player/tournament mode.
            if (this.player1Paddle) {
                this.player1Paddle.score = 0;
                this.player1Paddle.y = this.canvasElement.height / 2 - this.PADDLE_HEIGHT_NORMAL / 2;
            }
            if (this.player2Paddle) {
                this.player2Paddle.score = 0;
                this.player2Paddle.y = this.canvasElement.height / 2 - this.PADDLE_HEIGHT_NORMAL / 2;
            }
        }
        // Reset the ball's position and speed.
        if (this.ball) this.ball.reset(this.canvasElement.width, this.canvasElement.height);
    }

    /**
     * The main game loop function. It updates game state, draws elements,
     * and schedules itself for the next frame using `requestAnimationFrame`.
     */
    private gameLoop = (): void => {
        this.update(); // Update game logic.
        this.draw(); // Draw game elements.
        this.iterations++; // Increment iteration counter.

        // Introduce a small delay before starting the full game loop.
        // This gives players a moment to prepare after the ball resets.
        if (this.iterations === 1) {
            setTimeout(() => {
                if (!this.gameOver) this.gameLoopId = requestAnimationFrame(this.gameLoop);
            }, 2000); // 2-second delay after the very first frame.
        } else {
            // Continue the game loop normally.
            if (!this.gameOver) this.gameLoopId = requestAnimationFrame(this.gameLoop);
        }
    }

    /**
     * Starts the game. Cancels any existing game loop and starts a new one.
     */
    public start(): void {
        this.iterations = 0; // Reset iterations counter for the new game.
        if (this.gameLoopId) cancelAnimationFrame(this.gameLoopId); // Cancel any ongoing game loop.
        this.resetGameInternals(); // Reset scores, paddle positions, and ball for the new game.
        this.gameLoopId = requestAnimationFrame(this.gameLoop); // Start the new game loop.
    }
}