// src/Paddle.ts
export class Paddle {
    public x: number;
    public y: number;
    public width: number;
    public height: number;
    public color: string;
    public speed: number; // This speed will be used by AI as well
    public score: number;
    public name: string;

    constructor(
        x: number,
        y: number,
        width: number,
        height: number,
        initialColor: string,
        speed: number = 7,
        name: string = "Player"
    ) {
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
        this.color = initialColor;
        this.speed = speed;
        this.score = 0;
        this.name = name;
    }

    draw(ctx: CanvasRenderingContext2D): void {
        ctx.fillStyle = this.color;
        ctx.fillRect(this.x, this.y, this.width, this.height);
    }

    moveUp(): void {
        this.y -= this.speed;
        if (this.y < 0) {
            this.y = 0;
        }
    }

    moveDown(canvasHeight: number): void {
        this.y += this.speed;
        if (this.y + this.height > canvasHeight) {
            this.y = canvasHeight - this.height;
        }
    }

    // AI logic to track the ball's Y position
    updateAI(ballY: number, canvasHeight: number): void {
        const paddleCenter = this.y + this.height / 2;
        const reactionSpeed = this.speed * 0.85; // Make AI slightly slower or less precise than max paddle speed
        const deadZone = 5; // Small dead zone to prevent jittering when ball is aligned

        if (paddleCenter < ballY - deadZone) {
            this.y += reactionSpeed;
        } else if (paddleCenter > ballY + deadZone) {
            this.y -= reactionSpeed;
        }

        // Ensure paddle stays within bounds
        if (this.y < 0) {
            this.y = 0;
        }
        if (this.y + this.height > canvasHeight) {
            this.y = canvasHeight - this.height;
        }
    }
}