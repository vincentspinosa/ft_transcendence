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

    private aiTargetY: number; // Stores the AI's current target Y position for this paddle

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
        this.aiTargetY = y + height / 2; // Initialize AI target to current center
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

    /**
     * Sets the target Y position for this AI paddle.
     * Game.ts will call this periodically (e.g., once per second).
     * The target will be adjusted to aim for the paddle's center.
     */
    setAITargetY(targetY: number): void {
        // AI aims for the center of its paddle to intercept the ball
        this.aiTargetY = targetY - this.height / 2;

        // Ensure the target is within reasonable bounds of the paddle's movement
        // This prevents the AI from trying to move off-screen when aiming for the ball.
        if (this.aiTargetY < 0) {
            this.aiTargetY = 0;
        }
        // Ensure the paddle doesn't go below the canvas bottom
        // This makes the AI try to position its TOP at the calculated target Y
        // which means its bottom would be targetY + height
        // So, the maximum valid targetY for the paddle's top edge is canvasHeight - paddle.height
        if (this.aiTargetY + this.height > 600) { // Assuming canvasHeight is 600
            this.aiTargetY = 600 - this.height;
        }
    }

    /**
     * AI logic to move the paddle towards its stored aiTargetY.
     * This method is called every frame by Game.ts.
     */
    updateAI(canvasHeight: number): void {
        // The paddle moves at its defined speed towards the target Y
        // We're calculating the difference to determine direction
        let dy = this.aiTargetY - this.y;

        if (dy > this.speed) { // Move down if target is significantly below
            this.y += this.speed;
        } else if (dy < -this.speed) { // Move up if target is significantly above
            this.y -= this.speed;
        } else {
            // If within speed range (or dead zone), snap to target to prevent jittering
            this.y = this.aiTargetY;
        }

        // Ensure paddle stays within bounds (important as the target Y might be slightly out of bounds)
        if (this.y < 0) {
            this.y = 0;
        }
        if (this.y + this.height > canvasHeight) {
            this.y = canvasHeight - this.height;
        }
    }
}