export class SmallPowerUp {
    public x: number;
    public y: number;
    public radius: number;
    public color: string;
    public isActive: boolean; // Indicates if the power-up is still active/visible

    constructor(x: number, y: number, radius: number, color: string = 'green') {
        this.x = x;
        this.y = y;
        this.radius = radius;
        this.color = color;
        this.isActive = true;
    }

    /**
     * Draws the power-up on the canvas if it's active.
     * @param ctx The CanvasRenderingContext2D on which to draw.
     */
    draw(ctx: CanvasRenderingContext2D): void {
        if (this.isActive) {
            ctx.fillStyle = this.color;
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
            ctx.fill();
        }
    }

    /**
     * Checks for collision with the ball.
     * @param ball The Ball object to check collision against.
     * @returns True if a collision occurred, false otherwise.
     */
    checkCollision(ball: { x: number; y: number; radius: number }): boolean {
        if (!this.isActive) return false;

        const dx = this.x - ball.x;
        const dy = this.y - ball.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        // Collision if distance between centers is less than sum of radii
        if (distance < this.radius + ball.radius) {
            this.isActive = false; // Deactivate power-up after collision
            return true;
        }
        return false;
    }
}