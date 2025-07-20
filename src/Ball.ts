export class Ball {
    // Public properties representing the ball's current position, size, color, and speed.
    public x: number; // The current X-coordinate of the ball's center.
    public y: number; // The current Y-coordinate of the ball's center.
    public radius: number; // The radius of the ball.
    public color: string; // The color of the ball, in a format like CSS color strings (e.g., "red", "#00FF00").
    public speedX: number; // Current horizontal speed of the ball (pixels per frame).
    public speedY: number; // Current vertical speed of the ball (pixels per frame).

    // Private and read-only properties to store the initial speed components, which are used when the ball is reset.
    // Readonly -> value is assigned only once, at declaration or in the constructor
    private readonly initialSpeedXComponent: number; // The initial horizontal speed component provided at creation.
    private readonly initialSpeedYComponent: number; // The initial vertical speed component provided at creation.
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
        // Initialize the ball's position, radius, and color with the provided arguments.
        this.x = x;
        this.y = y;
        this.radius = radius;
        this.color = color;

        if (navigator.userAgent.toLowerCase().includes("chrome"))
        {
            speedX = 13;
            speedY = 13;
        }

        // Set the ball's current horizontal and vertical speeds.
        this.speedX = speedX;
        this.speedY = speedY;

        // Store the initial speed components. These values remain constant and are used
        // to determine the magnitude of the speed when the ball is reset.
        this.initialSpeedXComponent = speedX;
        this.initialSpeedYComponent = speedY;
    }

    /**
     * Draws the ball on the provided 2D rendering context of a canvas.
     * @param ctx The CanvasRenderingContext2D on which to draw the ball.
     * "The CanvasRenderingContext2D interface, part of the Canvas API, 
     * provides the 2D rendering context for the drawing surface of a element. 
     * It is used for drawing shapes, text, images, and other objects."
     */
    draw(ctx: CanvasRenderingContext2D): void {
        // Set the fill style to the ball's color.
        ctx.fillStyle = this.color;
        // Begin a new path for drawing.
        ctx.beginPath();
        // Draw a circle representing the ball. The arc method's last two arguments (0, Math.PI * 2)
        // ensure a full circle is drawn.
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        // Fill the drawn path with the current fill style (the ball's color).
        ctx.fill();
    }

    /**
     * Updates the ball's position and handles collisions with the top and bottom walls of the canvas.
     * @param canvasHeight The height of the canvas, used for collision detection with top/bottom walls.
     */
    update(canvasHeight: number): void {
        // Move the ball by adding its current speed components to its position.
        this.x += this.speedX;
        this.y += this.speedY;

        // Check for collision with the top or bottom walls.
        // If the ball's top edge is above 0 or its bottom edge is below the canvas height,
        // it means a collision has occurred.
        if (this.y - this.radius < 0 || this.y + this.radius > canvasHeight) {
            // Reverse the vertical speed to make the ball "bounce" off the wall.
            this.speedY *= -1;
            // Adjust the ball's position to prevent it from getting stuck inside the wall
            // if it overshoots due to its speed.
            if (this.y - this.radius < 0) this.y = this.radius; // If it went above the top, place it at the top edge.
            if (this.y + this.radius > canvasHeight) this.y = canvasHeight - this.radius; // If it went below the bottom, place it at the bottom edge.
        }
    }

    /**
     * Resets the ball's position to the center of the canvas and randomizes its direction
     * while maintaining its initial speed magnitude.
     * @param canvasWidth The width of the canvas, used to determine the center X-coordinate.
     * @param canvasHeight The height of the canvas, used to determine the center Y-coordinate.
     */
    reset(canvasWidth: number, canvasHeight: number): void {
        // Set the ball's position to the center of the canvas.
        this.x = canvasWidth / 2;
        this.y = canvasHeight / 2;

        // Calculate the magnitude (total speed) of the ball based on its initial speed components.
        // This ensures the ball always resets with the same overall speed, but in a new direction.
        const initialSpeedMagnitude = Math.sqrt(
            this.initialSpeedXComponent * this.initialSpeedXComponent +
            this.initialSpeedYComponent * this.initialSpeedYComponent
        );

        // Generate a random angle for the ball's new direction.
        // The angle is chosen between -45 degrees (-Math.PI/4 radians) and 45 degrees (Math.PI/4 radians)
        // relative to the horizontal axis. This prevents the ball from moving almost perfectly vertically,
        // which can lead to dull gameplay in some contexts (like Pong).
        const angle = Math.random() * Math.PI / 2 - Math.PI / 4;

        // Set the new horizontal speed (speedX).
        // A random check (Math.random() > 0.5) determines if the ball moves left or right initially.
        // The speed is then calculated using the initial speed magnitude and the cosine of the random angle.
        this.speedX = (Math.random() > 0.5 ? 1 : -1) * initialSpeedMagnitude * Math.cos(angle);
        // Set the new vertical speed (speedY).
        // The speed is calculated using the initial speed magnitude and the sine of the random angle.
        this.speedY = initialSpeedMagnitude * Math.sin(angle);
    }
}