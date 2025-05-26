// src/Game.ts
import { Paddle } from './Paddle';
import { Ball } from './Ball';
import { PlayerConfig, MatchSettings, FourPlayerMatchSettings } from './interfaces';

export class Game {
    private canvasElement: HTMLCanvasElement;
    private ctx: CanvasRenderingContext2D;
    private ball!: Ball;
    private gameLoopId: number | null = null;

    // Game Mode and Player/Team Structures
    private gameMode: '2player' | '4player' | 'tournament' | null = null;
    private scoreLimit: number = 0;

    // For 2-player modes (1v1 single match, 1v1 tournament match)
    public player1Paddle!: Paddle; // Represents Player A (left)
    public player2Paddle!: Paddle; // Represents Player B (right)
    private playerAConfig!: PlayerConfig; // Config for Player A
    private playerBConfig!: PlayerConfig; // Config for Player B
    private lastSingleMatchSettings: MatchSettings | null = null;

    // For 4-player mode (2v2 single match)
    private team1Paddles: Paddle[] = []; // [TopLeft, BottomLeft]
    private team2Paddles: Paddle[] = []; // [TopRight, BottomRight]
    private team1Score: number = 0;
    private team2Score: number = 0;
    private activePlayers: PlayerConfig[] = []; // Stores all 4 player configs for 2v2
    private team1PlayerAConfig!: PlayerConfig;
    private team1PlayerBConfig!: PlayerConfig;
    private team2PlayerAConfig!: PlayerConfig;
    private team2PlayerBConfig!: PlayerConfig;
    private lastFourPlayerMatchSettings: FourPlayerMatchSettings | null = null;

    private readonly PADDLE_WIDTH = 15;
    private readonly PADDLE_HEIGHT_NORMAL = 100;
    private readonly PADDLE_HEIGHT_FOUR_PLAYER = 75;
    private readonly BALL_RADIUS = 8;
    private readonly PADDLE_SPEED = 7;


    private keysPressed: { [key: string]: boolean } = {};
    private gameOver: boolean = false;
    private winnerMessage: string = "";

    // UI elements for match over
    private singleMatchOverScreenDiv: HTMLElement;
    private singleMatchOverMessageElement: HTMLElement;
    private singleMatchPlayAgainButton: HTMLButtonElement;
    private singleMatchOverButtonsDiv: HTMLElement;
    private tournamentMatchOverButtonsDiv: HTMLElement;

    // For tournament play
    private isTournamentMatchFlag: boolean = false;
    private onMatchCompleteCallback: ((winner: PlayerConfig) => void) | null = null; // For 1v1 tournament winner


    constructor(
        canvasId: string,
        matchOverScreenId: string,
        matchOverMessageId: string,
        singleMatchPlayAgainBtnId: string,
        singleMatchOverButtonsId: string,
        tournamentMatchOverButtonsId: string
    ) {
        this.canvasElement = document.getElementById(canvasId) as HTMLCanvasElement;
        if (!this.canvasElement) throw new Error(`Canvas element with ID '${canvasId}' not found.`);
        this.ctx = this.canvasElement.getContext('2d')!;
        if (!this.ctx) throw new Error('Failed to get 2D rendering context.');

        this.singleMatchOverScreenDiv = document.getElementById(matchOverScreenId) as HTMLElement;
        this.singleMatchOverMessageElement = document.getElementById(matchOverMessageId) as HTMLElement;
        this.singleMatchPlayAgainButton = document.getElementById(singleMatchPlayAgainBtnId) as HTMLButtonElement;
        this.singleMatchOverButtonsDiv = document.getElementById(singleMatchOverButtonsId) as HTMLElement;
        this.tournamentMatchOverButtonsDiv = document.getElementById(tournamentMatchOverButtonsId) as HTMLElement;

        if (this.singleMatchPlayAgainButton) {
            this.singleMatchPlayAgainButton.onclick = () => this.handlePlayAgain();
        }
    }

    private showElement(element: HTMLElement, displayType: string = 'block'): void {
        if (element) element.style.display = displayType;
    }
    private hideElement(element: HTMLElement): void {
        if (element) element.style.display = 'none';
    }

    private handlePlayAgain(): void {
        if (this.singleMatchOverScreenDiv) this.hideElement(this.singleMatchOverScreenDiv);
        if (this.canvasElement) this.showElement(this.canvasElement);

        if ((this.gameMode === '2player' || this.gameMode === 'tournament') && this.lastSingleMatchSettings) {
            this.initializeGame(this.lastSingleMatchSettings, this.isTournamentMatchFlag, this.onMatchCompleteCallback);
            this.start();
        } else if (this.gameMode === '4player' && this.lastFourPlayerMatchSettings) {
            this.initializeFourPlayerMatch(this.lastFourPlayerMatchSettings);
            this.start();
        } else {
            console.error("Cannot play again: last match settings not available or game mode unclear.", this.gameMode);
            // Fallback: Potentially show main menu via a call to a main.ts function if possible, or alert.
            alert("Error restarting game. Please return to main menu.");
        }
    }

    public initializeGame( // For 1v1 matches (single or tournament)
        settings: MatchSettings,
        isTournament: boolean,
        onCompleteCallback: ((winner: PlayerConfig) => void) | null
    ): void {
        this.gameMode = isTournament ? 'tournament' : '2player';
        this.isTournamentMatchFlag = isTournament;
        this.onMatchCompleteCallback = onCompleteCallback;

        this.playerAConfig = { ...settings.playerA };
        this.playerBConfig = { ...settings.playerB };
        this.activePlayers = [this.playerAConfig, this.playerBConfig];
        this.scoreLimit = settings.scoreLimit;

        if (!isTournament) {
            this.lastSingleMatchSettings = { ...settings };
        }
        this.lastFourPlayerMatchSettings = null;

        this.canvasElement.width = 800;
        this.canvasElement.height = 600;

        this.player1Paddle = new Paddle(30, this.canvasElement.height / 2 - this.PADDLE_HEIGHT_NORMAL / 2, this.PADDLE_WIDTH, this.PADDLE_HEIGHT_NORMAL, this.playerAConfig.color, this.PADDLE_SPEED, this.playerAConfig.name);
        this.player2Paddle = new Paddle(this.canvasElement.width - 30 - this.PADDLE_WIDTH, this.canvasElement.height / 2 - this.PADDLE_HEIGHT_NORMAL / 2, this.PADDLE_WIDTH, this.PADDLE_HEIGHT_NORMAL, this.playerBConfig.color, this.PADDLE_SPEED, this.playerBConfig.name);

        this.team1Paddles = []; this.team2Paddles = [];
        this.team1Score = 0; this.team2Score = 0;

        this.ball = new Ball(this.canvasElement.width / 2, this.canvasElement.height / 2, this.BALL_RADIUS, '#FFF');
        this.setupInput();
        this.resetGameInternals(); // Ensure game state is fresh
    }

    public initializeFourPlayerMatch(settings: FourPlayerMatchSettings): void {
        this.gameMode = '4player';
        this.isTournamentMatchFlag = false;
        this.onMatchCompleteCallback = null;

        this.team1PlayerAConfig = { ...settings.team1PlayerA };
        this.team1PlayerBConfig = { ...settings.team1PlayerB };
        this.team2PlayerAConfig = { ...settings.team2PlayerA };
        this.team2PlayerBConfig = { ...settings.team2PlayerB };
        this.activePlayers = [this.team1PlayerAConfig, this.team1PlayerBConfig, this.team2PlayerAConfig, this.team2PlayerBConfig];
        this.scoreLimit = settings.scoreLimit;
        this.lastFourPlayerMatchSettings = { ...settings };
        this.lastSingleMatchSettings = null;

        this.canvasElement.width = 800;
        this.canvasElement.height = 600;

        const paddleHeight = this.PADDLE_HEIGHT_FOUR_PLAYER;
        const topY = this.canvasElement.height / 4 - paddleHeight / 2;        // Approx 150 - 37.5 = 112.5
        const bottomY = (3 * this.canvasElement.height) / 4 - paddleHeight / 2; // Approx 450 - 37.5 = 412.5

        this.team1Paddles = [
            new Paddle(30, topY, this.PADDLE_WIDTH, paddleHeight, settings.team1PlayerA.color, this.PADDLE_SPEED, settings.team1PlayerA.name),
            new Paddle(30, bottomY, this.PADDLE_WIDTH, paddleHeight, settings.team1PlayerB.color, this.PADDLE_SPEED, settings.team1PlayerB.name)
        ];
        this.team2Paddles = [
            new Paddle(this.canvasElement.width - 30 - this.PADDLE_WIDTH, topY, this.PADDLE_WIDTH, paddleHeight, settings.team2PlayerA.color, this.PADDLE_SPEED, settings.team2PlayerA.name),
            new Paddle(this.canvasElement.width - 30 - this.PADDLE_WIDTH, bottomY, this.PADDLE_WIDTH, paddleHeight, settings.team2PlayerB.color, this.PADDLE_SPEED, settings.team2PlayerB.name)
        ];
        
        // Clear 1v1 paddles if they were used previously
        this.player1Paddle = null as any; // Or undefined
        this.player2Paddle = null as any; // Or undefined

        this.team1Score = 0; this.team2Score = 0;

        this.ball = new Ball(this.canvasElement.width / 2, this.canvasElement.height / 2, this.BALL_RADIUS, '#FFF');
        this.setupInput();
        this.resetGameInternals(); // Ensure game state is fresh
    }

    private setupInput(): void {
        window.onkeydown = null; window.onkeyup = null; this.keysPressed = {};
        window.addEventListener('keydown', (event) => { if (!this.gameOver) this.keysPressed[event.key.toUpperCase()] = true; });
        window.addEventListener('keyup', (event) => { this.keysPressed[event.key.toUpperCase()] = false; });
    }

    private handlePlayerInput(): void {
        if (this.gameOver) return;

        if (this.gameMode === '4player') {
            // Team 1 (Left)
            if (this.team1PlayerAConfig?.type === 'human' && this.team1Paddles[0]) {
                if (this.keysPressed['A']) this.team1Paddles[0].moveUp();
                if (this.keysPressed['Q']) this.team1Paddles[0].moveDown(this.canvasElement.height);
            }
            if (this.team1PlayerBConfig?.type === 'human' && this.team1Paddles[1]) {
                if (this.keysPressed['W']) this.team1Paddles[1].moveUp();
                if (this.keysPressed['S']) this.team1Paddles[1].moveDown(this.canvasElement.height);
            }
            // Team 2 (Right)
            if (this.team2PlayerAConfig?.type === 'human' && this.team2Paddles[0]) {
                if (this.keysPressed['P']) this.team2Paddles[0].moveUp();
                if (this.keysPressed['M']) this.team2Paddles[0].moveDown(this.canvasElement.height);
            }
            if (this.team2PlayerBConfig?.type === 'human' && this.team2Paddles[1]) {
                if (this.keysPressed['O']) this.team2Paddles[1].moveUp();
                if (this.keysPressed['L']) this.team2Paddles[1].moveDown(this.canvasElement.height);
            }
        } else { // 2-player or tournament mode
            if (this.playerAConfig?.type === 'human' && this.player1Paddle) {
                if (this.keysPressed['A']) this.player1Paddle.moveUp();
                if (this.keysPressed['Q']) this.player1Paddle.moveDown(this.canvasElement.height);
            }
            if (this.playerBConfig?.type === 'human' && this.player2Paddle) {
                if (this.keysPressed['P']) this.player2Paddle.moveUp();
                if (this.keysPressed['M']) this.player2Paddle.moveDown(this.canvasElement.height);
            }
        }
    }

    private updateAI(): void {
        if (this.gameOver || !this.ball) return;

        if (this.gameMode === '4player') {
            const playerConfigs = [this.team1PlayerAConfig, this.team1PlayerBConfig, this.team2PlayerAConfig, this.team2PlayerBConfig];
            const paddles = [...this.team1Paddles, ...this.team2Paddles]; // Combine for easier mapping

            playerConfigs.forEach((player, index) => {
                if (player?.type === 'ai') {
                    const paddleToControl = (index < 2) ? this.team1Paddles[index] : this.team2Paddles[index - 2];
                    if (paddleToControl) {
                        paddleToControl.updateAI(this.ball.y, this.canvasElement.height);
                    }
                }
            });
        } else { // 2-player or tournament
            if (this.playerAConfig?.type === 'ai' && this.player1Paddle) {
                this.player1Paddle.updateAI(this.ball.y, this.canvasElement.height);
            }
            if (this.playerBConfig?.type === 'ai' && this.player2Paddle) {
                this.player2Paddle.updateAI(this.ball.y, this.canvasElement.height);
            }
        }
    }

    private checkCollision(): void {
        if (!this.ball) return;
        if (this.gameMode === '4player') {
            this.checkFourPlayerCollisions();
        } else {
            this.checkTwoPlayerCollisions();
        }
    }

    private checkTwoPlayerCollisions(): void {
        if (!this.ball || !this.player1Paddle || !this.player2Paddle) return;
        const paddles = [this.player1Paddle, this.player2Paddle];
        const isLeftPaddle = [true, false];

        for (let i = 0; i < paddles.length; i++) {
            const paddle = paddles[i];
            const hitLeft = isLeftPaddle[i] && this.ball.x - this.ball.radius < paddle.x + paddle.width && this.ball.x - this.ball.radius > paddle.x;
            const hitRight = !isLeftPaddle[i] && this.ball.x + this.ball.radius > paddle.x && this.ball.x + this.ball.radius < paddle.x + paddle.width;
            
            if ((hitLeft || hitRight) &&
                this.ball.y + this.ball.radius > paddle.y &&
                this.ball.y - this.ball.radius < paddle.y + paddle.height) {
                
                this.ball.speedX *= -1;
                // Adjust ball position to prevent sticking
                this.ball.x = isLeftPaddle[i] ? (paddle.x + paddle.width + this.ball.radius) : (paddle.x - this.ball.radius);
                
                let deltaY = this.ball.y - (paddle.y + paddle.height / 2);
                this.ball.speedY = deltaY * 0.25; 
                break; // Important: only one paddle collision per frame for primary bounce
            }
        }

        // Scoring
        if (this.ball.x - this.ball.radius < 0) {
            this.player2Paddle.score++; this.ball.reset(this.canvasElement.width, this.canvasElement.height); this.checkWinCondition();
        } else if (this.ball.x + this.ball.radius > this.canvasElement.width) {
            this.player1Paddle.score++; this.ball.reset(this.canvasElement.width, this.canvasElement.height); this.checkWinCondition();
        }
    }

    private checkFourPlayerCollisions(): void {
        if (!this.ball || this.team1Paddles.length < 2 || this.team2Paddles.length < 2) return;
        let collisionOccurred = false;

        // Team 1 (Left) Paddles
        for (const paddle of this.team1Paddles) {
            if (this.ball.x - this.ball.radius < paddle.x + paddle.width &&
                this.ball.x > paddle.x && // Ensure ball is somewhat past the front
                this.ball.y + this.ball.radius > paddle.y &&
                this.ball.y - this.ball.radius < paddle.y + paddle.height) {
                this.ball.speedX *= -1;
                this.ball.x = paddle.x + paddle.width + this.ball.radius;
                let deltaY = this.ball.y - (paddle.y + paddle.height / 2);
                this.ball.speedY = deltaY * 0.20 + (Math.random() - 0.5) * 2; // More variance
                collisionOccurred = true;
                break;
            }
        }

        if (collisionOccurred) return; // Only one collision bounce logic per frame

        // Team 2 (Right) Paddles
        for (const paddle of this.team2Paddles) {
            if (this.ball.x + this.ball.radius > paddle.x &&
                this.ball.x < paddle.x + paddle.width && // Ensure ball is somewhat past the front
                this.ball.y + this.ball.radius > paddle.y &&
                this.ball.y - this.ball.radius < paddle.y + paddle.height) {
                this.ball.speedX *= -1;
                this.ball.x = paddle.x - this.ball.radius;
                let deltaY = this.ball.y - (paddle.y + paddle.height / 2);
                this.ball.speedY = deltaY * 0.20 + (Math.random() - 0.5) * 2; // More variance
                collisionOccurred = true;
                break;
            }
        }
        
        if (collisionOccurred) return;

        // Scoring for 4-player
        if (this.ball.x - this.ball.radius < 0) {
            this.team2Score++; this.ball.reset(this.canvasElement.width, this.canvasElement.height); this.checkWinCondition();
        } else if (this.ball.x + this.ball.radius > this.canvasElement.width) {
            this.team1Score++; this.ball.reset(this.canvasElement.width, this.canvasElement.height); this.checkWinCondition();
        }
    }

    private checkWinCondition(): void {
        if (this.gameOver) return; // Already decided

        if (this.gameMode === '4player') {
            if (this.team1Score >= this.scoreLimit) {
                this.gameOver = true;
                this.winnerMessage = `Team ${this.team1PlayerAConfig.name} & ${this.team1PlayerBConfig.name} wins!`;
            } else if (this.team2Score >= this.scoreLimit) {
                this.gameOver = true;
                this.winnerMessage = `Team ${this.team2PlayerAConfig.name} & ${this.team2PlayerBConfig.name} wins!`;
            }
        } else { // 2-player or tournament
            if (!this.player1Paddle || !this.player2Paddle || !this.playerAConfig || !this.playerBConfig) return;
            let winner: PlayerConfig | null = null;
            if (this.player1Paddle.score >= this.scoreLimit) {
                winner = this.playerAConfig;
                this.winnerMessage = `${this.playerAConfig.name} wins the match!`;
            } else if (this.player2Paddle.score >= this.scoreLimit) {
                winner = this.playerBConfig;
                this.winnerMessage = `${this.playerBConfig.name} wins the match!`;
            }
            if (winner) {
                this.gameOver = true;
                if (this.isTournamentMatchFlag && this.onMatchCompleteCallback) {
                    this.onMatchCompleteCallback(winner);
                }
            }
        }

        if (this.gameOver) {
            this.triggerMatchOver();
        }
    }

    private triggerMatchOver(): void {
        if (this.gameLoopId) { cancelAnimationFrame(this.gameLoopId); this.gameLoopId = null; }
        if (this.canvasElement) this.hideElement(this.canvasElement);

        if (this.isTournamentMatchFlag) {
            // Tournament manager handles its own "match over" UI that leads to "Next Match"
            // The onMatchCompleteCallback was already called in checkWinCondition.
            // So, Game class doesn't need to show the generic matchOverScreen for tournament matches.
            return;
        }
        
        // For single 1v1 or 2v2 matches:
        if (this.singleMatchOverMessageElement) {
            this.singleMatchOverMessageElement.textContent = this.winnerMessage;
        }
        if (this.tournamentMatchOverButtonsDiv) this.hideElement(this.tournamentMatchOverButtonsDiv);
        if (this.singleMatchOverButtonsDiv) this.showElement(this.singleMatchOverButtonsDiv);
        if (this.singleMatchOverScreenDiv) this.showElement(this.singleMatchOverScreenDiv, 'flex');
    }

    private update(): void {
        if (this.gameOver) return;
        this.handlePlayerInput();
        this.updateAI();
        if (this.ball) this.ball.update(this.canvasElement.width, this.canvasElement.height);
        this.checkCollision();
    }

    private drawScores(): void {
        this.ctx.fillStyle = '#FFF'; this.ctx.font = '28px Arial'; this.ctx.textAlign = 'left';

        if (this.gameMode === '4player') {
            const t1Name = `Team ${this.team1PlayerAConfig?.name[0]}/${this.team1PlayerBConfig?.name[0]}`; // Short team name
            const t2Name = `Team ${this.team2PlayerAConfig?.name[0]}/${this.team2PlayerBConfig?.name[0]}`;
            this.ctx.fillText(`${t1Name}: ${this.team1Score}`, 50, 50);
            this.ctx.textAlign = 'right';
            this.ctx.fillText(`${t2Name}: ${this.team2Score}`, this.canvasElement.width - 50, 50);
        } else if (this.player1Paddle && this.player2Paddle && this.playerAConfig && this.playerBConfig) {
            this.ctx.fillText(`${this.playerAConfig.name}: ${this.player1Paddle.score}`, 50, 50);
            this.ctx.textAlign = 'right';
            this.ctx.fillText(`${this.playerBConfig.name}: ${this.player2Paddle.score}`, this.canvasElement.width - 50, 50);
        }
        this.ctx.textAlign = 'left';
    }

    private drawNet(): void {
        this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)'; this.ctx.lineWidth = 4;
        this.ctx.beginPath(); this.ctx.setLineDash([10, 10]);
        this.ctx.moveTo(this.canvasElement.width / 2, 0); this.ctx.lineTo(this.canvasElement.width / 2, this.canvasElement.height);
        this.ctx.stroke(); this.ctx.setLineDash([]);
    }

    private draw(): void {
        this.ctx.fillStyle = '#000'; this.ctx.fillRect(0, 0, this.canvasElement.width, this.canvasElement.height);
        if (!this.gameOver) {
            this.drawNet();
            if (this.gameMode === '4player') {
                this.team1Paddles.forEach(p => p?.draw(this.ctx));
                this.team2Paddles.forEach(p => p?.draw(this.ctx));
            } else if (this.player1Paddle && this.player2Paddle) {
                this.player1Paddle.draw(this.ctx);
                this.player2Paddle.draw(this.ctx);
            }
            if (this.ball) this.ball.draw(this.ctx);
            this.drawScores();
        }
    }
    
    private resetGameInternals(): void { // Renamed from resetGame to avoid confusion with public start
        this.gameOver = false;
        this.winnerMessage = "";
        this.keysPressed = {};

        if (this.gameMode === '4player') {
            this.team1Score = 0; this.team2Score = 0;
            const paddleHeight = this.PADDLE_HEIGHT_FOUR_PLAYER;
            const topY = this.canvasElement.height / 4 - paddleHeight / 2;
            const bottomY = (3 * this.canvasElement.height) / 4 - paddleHeight / 2;

            if (this.team1Paddles[0]) { this.team1Paddles[0].y = topY; this.team1Paddles[0].score = 0; }
            if (this.team1Paddles[1]) { this.team1Paddles[1].y = bottomY; this.team1Paddles[1].score = 0; }
            if (this.team2Paddles[0]) { this.team2Paddles[0].y = topY; this.team2Paddles[0].score = 0; }
            if (this.team2Paddles[1]) { this.team2Paddles[1].y = bottomY; this.team2Paddles[1].score = 0; }
        } else {
            if (this.player1Paddle) {
                this.player1Paddle.score = 0;
                this.player1Paddle.y = this.canvasElement.height / 2 - this.PADDLE_HEIGHT_NORMAL / 2;
            }
            if (this.player2Paddle) {
                this.player2Paddle.score = 0;
                this.player2Paddle.y = this.canvasElement.height / 2 - this.PADDLE_HEIGHT_NORMAL / 2;
            }
        }
        if (this.ball) this.ball.reset(this.canvasElement.width, this.canvasElement.height);
    }

    private gameLoop = (): void => {
        this.update(); this.draw();
        if (!this.gameOver) this.gameLoopId = requestAnimationFrame(this.gameLoop);
    }

    public start(): void {
        if (this.gameLoopId) cancelAnimationFrame(this.gameLoopId);
        this.resetGameInternals(); // Use the internal reset method
        this.gameLoopId = requestAnimationFrame(this.gameLoop);
    }
}