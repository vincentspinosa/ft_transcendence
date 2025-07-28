export class Paddle {
    // Public properties representing the paddle's current position, dimensions, color, speed, score, and name.
    public x: number; // The current X-coordinate of the paddle's top-left corner.
    public y: number; // The current Y-coordinate of the paddle's top-left corner.
    public width: number; // The width of the paddle.
    public height: number; // The height of the paddle.
    public color: string; // The color of the paddle (e.g., "blue", "#FF0000").
    public speed: number; // The movement speed of the paddle (pixels per frame). This speed is used for both player and AI movement.
    public score: number; // The current score associated with this paddle (e.g., in a Pong game).
    public name: string; // The name of the paddle, typically "Player" or "AI".

    // Private property to store the AI's calculated target Y position for the paddle's top edge.
    private aiTargetY: number; // Stores the AI's current target Y position for this paddle's top edge.

    /**
     * Creates an instance of Paddle.
     * @param x The initial X-coordinate of the paddle's top-left corner.
     * @param y The initial Y-coordinate of the paddle's top-left corner.
     * @param width The width of the paddle.
     * @param height The height of the paddle.
     * @param initialColor The initial color of the paddle.
     * @param speed The movement speed of the paddle. Defaults to 13 if not provided.
     * @param name The name of the paddle. Defaults to "Player" if not provided.
     */
    constructor(
        x: number,
        y: number,
        width: number,
        height: number,
        initialColor: string,
        speed: number = 13,
        name: string = "Player"
    ) {
        // Initialize the paddle's properties with the provided arguments.
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
        this.color = initialColor;
        this.speed = speed;
        this.score = 0; // Initialize score to 0 for a new paddle.
        this.name = name;
        // Initialize the AI target Y to the current center of the paddle.
        // This ensures the AI has a valid target even before the ball starts moving.
        this.aiTargetY = y + height / 2;
    }

    /**
     * Draws the paddle on the provided 2D rendering context of a canvas.
     * @param ctx The CanvasRenderingContext2D on which to draw the paddle.
     */
    draw(ctx: CanvasRenderingContext2D): void {
        // Set the fill style to the paddle's color.
        ctx.fillStyle = this.color;
        // Draw a filled rectangle representing the paddle at its current position and dimensions.
        ctx.fillRect(this.x, this.y, this.width, this.height);
    }

    /**
     * Moves the paddle upwards by its defined speed.
     * Prevents the paddle from moving off the top edge of the canvas.
     */
    moveUp(): void {
        // Decrease the paddle's Y-coordinate to move it up.
        this.y -= this.speed;
        // Clamp the paddle's position to prevent it from going above the top edge (Y=0).
        if (this.y < 0) {
            this.y = 0;
        }
    }

    /**
     * Moves the paddle downwards by its defined speed.
     * Prevents the paddle from moving off the bottom edge of the canvas.
     * @param canvasHeight The height of the canvas, used for boundary checking.
     */
    moveDown(canvasHeight: number): void {
        // Increase the paddle's Y-coordinate to move it down.
        this.y += this.speed;
        // Clamp the paddle's position to prevent it from going below the bottom edge.
        // The bottom edge of the paddle is this.y + this.height.
        if (this.y + this.height > canvasHeight) {
            this.y = canvasHeight - this.height;
        }
    }

    /**
     * Sets the target Y position for this AI paddle.
     * This method is typically called by the game logic (e.g., Game.ts) periodically
     * to update where the AI should aim based on the ball's position.
     * The target will be adjusted to aim for the paddle's center,
     * then there is a randomiszation mecanism to make the AI hit the ball with a random angle.
     * @param targetY The Y-coordinate the AI should aim for (e.g., the ball's Y-coordinate).
     */
    setAITargetY(targetY: number, canvasHeight: number): void {
        // The AI aims to position the center of its paddle at the `targetY`.
        // Therefore, the paddle's top edge (`this.aiTargetY`) should be `targetY - this.height / 2`.
        this.aiTargetY = targetY - this.height / 2;

        // Ensure the calculated target Y for the paddle's top edge is within the canvas bounds.
        // This prevents the AI from trying to move the paddle partially or entirely off-screen.
        if (this.aiTargetY < 0) {
            this.aiTargetY = 0; // If target is above top, set it to the top edge.
        }
        // If the paddle's bottom edge (this.aiTargetY + this.height) would go below the canvas bottom,
        // adjust the target so the paddle's bottom aligns with the canvas bottom.
        if (this.aiTargetY + this.height > canvasHeight) {
            this.aiTargetY = canvasHeight - this.height;
        }

        // ANGLE RANDOMIZATION
        let x : number = Math.random();
        if (x > 0.5)
            this.aiTargetY += this.height / 4;
        else
            this.aiTargetY -= this.height / 4;
    }

    /**
     * Implements the AI logic to move the paddle towards its stored `aiTargetY`.
     * This method is called every frame by the main game loop (e.g., in Game.ts).
     * @param canvasHeight The height of the canvas, used for boundary checking after movement.
     */
    updateAI(canvasHeight: number): void {
        // Calculate the difference between the target Y and the paddle's current Y.
        // This `dy` value indicates the direction and distance the paddle needs to move.
        let dy = this.aiTargetY - this.y;

        // If the target is significantly below the current position (more than one speed increment), move down.
        if (dy > this.speed) {
            this.y += this.speed;
        }
        // If the target is significantly above the current position (more than one speed increment in the negative direction), move up.
        else if (dy < -this.speed) {
            this.y -= this.speed;
        }
        // If the paddle is very close to the target (within one speed increment), snap it to the target.
        // This prevents the paddle from "jittering" back and forth when it's almost at the target.
        else {
            this.y = this.aiTargetY;
        }

        // After moving, ensure the paddle remains within the canvas bounds.
        // This is a safety check, as the `aiTargetY` calculation already tries to keep it in bounds,
        // but continuous movement might slightly overshoot or be affected by floating point inaccuracies.
        if (this.y < 0) {
            this.y = 0; // Clamp to the top edge.
        }
        if (this.y + this.height > canvasHeight) {
            this.y = canvasHeight - this.height; // Clamp to the bottom edge.
        }
    }
}
