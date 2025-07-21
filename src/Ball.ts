export class Ball {
    public x: number; // The current X-coordinate of the ball's center.
    public y: number; // The current Y-coordinate of the ball's center.
    public radius: number; // The radius of the ball.
    public color: string; // The color of the ball, in a format like CSS color strings (e.g., "red", "#00FF00").
    public speedX: number; // Current horizontal speed of the ball (pixels per frame).
    public speedY: number; // Current vertical speed of the ball (pixels per frame).

    private readonly initialSpeedXComponent: number; // The initial horizontal speed component provided at creation.
    private readonly initialSpeedYComponent: number; // The initial vertical speed component provided at creation.
    private readonly originalRadius: number; // Stores the original radius for resetting.

    /**
     * Creates an instance of Ball.
     * @param x The initial X-coordinate of the ball's center.
     * @param y The initial Y-coordinate of the ball's center.
     * @param radius The radius of the ball.
     * @param color The color of the ball.
     * @param speedX The initial horizontal speed.
     * @param speedY The initial vertical speed.
     */
    constructor(x: number, y: number, radius: number, color: string, speedX: number = 6, speedY: number = 6) {
        this.x = x;
        this.y = y;
        this.radius = radius;
        this.color = color;
        this.originalRadius = radius; // Store the original radius

        if (navigator.userAgent.toLowerCase().includes("chrome")) {
            speedX = 13;
            speedY = 13;
        }

        this.speedX = speedX;
        this.speedY = speedY;

        this.initialSpeedXComponent = speedX;
        this.initialSpeedYComponent = speedY;
    }

    /**
     * Draws the ball on the provided 2D rendering context of a canvas.
     * @param ctx The CanvasRenderingContext2D on which to draw the ball.
     */
    draw(ctx: CanvasRenderingContext2D): void {
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fill();
    }

    /**
     * Updates the ball's position and handles collisions with the top and bottom walls of the canvas.
     * @param canvasHeight The height of the canvas, used for collision detection with top/bottom walls.
     */
    update(canvasHeight: number): void {
        this.x += this.speedX;
        this.y += this.speedY;

        if (this.y - this.radius < 0 || this.y + this.radius > canvasHeight) {
            this.speedY *= -1;
            if (this.y - this.radius < 0) this.y = this.radius;
            if (this.y + this.radius > canvasHeight) this.y = canvasHeight - this.radius;
        }
    }

    /**
     * Resets the ball's position to the center of the canvas and randomizes its direction
     * while maintaining its current speed magnitude. This method does NOT reset the ball's
     * radius or overall speed magnitude to its initial values after a power-up.
     * @param canvasWidth The width of the canvas, used to determine the center X-coordinate.
     * @param canvasHeight The height of the canvas, used to determine the center Y-coordinate.
     */
    reset(canvasWidth: number, canvasHeight: number): void {
        this.x = canvasWidth / 2;
        this.y = canvasHeight / 2;

        const currentSpeedMagnitude = Math.sqrt(
            this.speedX * this.speedX + this.speedY * this.speedY
        );

        const angle = Math.random() > 0.5 ? Math.PI / 4 : -Math.PI / 4;

        this.speedX = (Math.random() > 0.5 ? 1 : -1) * currentSpeedMagnitude * Math.cos(angle);
        this.speedY = 0; // Keeping speedY 0 after reset to match original behavior.
    }

    /**
     * Doubles the ball's radius.
     */
    public doubleRadius(): void {
        this.radius = this.originalRadius * 2;
    }

    /**
     * Doubles the ball's radius.
     */
    public shrinkRadius(): void {
        this.radius = this.originalRadius / 2;
    }

    /**
     * Increases the ball's current speed (both X and Y components) by a given percentage.
     * @param percentage The percentage to increase speed by (e.g., 0.50 for 50%).
     */
    public augmentSpeed(percentage: number): void {
        this.speedX *= (1 + percentage);
        this.speedY *= (1 + percentage);
    }
}