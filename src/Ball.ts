export class Ball {
    public x: number;
    public y: number;
    public radius: number;
    public color: string;
    public speedX: number;
    public speedY: number;

    constructor(x: number, y: number, radius: number, color: string, speedX: number = 4, speedY: number = 4) {
        this.x = x;
        this.y = y;
        this.radius = radius;
        this.color = color;
        this.speedX = speedX;
        this.speedY = speedY;
    }

    draw(ctx: CanvasRenderingContext2D): void {
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fill();
    }

    update(canvasWidth: number, canvasHeight: number): void {
        this.x += this.speedX;
        this.y += this.speedY;

        // Bounce off top and bottom walls
        if (this.y - this.radius < 0 || this.y + this.radius > canvasHeight) {
            this.speedY *= -1;
            if (this.y - this.radius < 0) this.y = this.radius;
            if (this.y + this.radius > canvasHeight) this.y = canvasHeight - this.radius;
        }
    }

    reset(canvasWidth: number, canvasHeight: number): void {
        this.x = canvasWidth / 2;
        this.y = canvasHeight / 2;
        // Randomize direction after reset, but not too vertical
        const angle = Math.random() * Math.PI / 2 - Math.PI / 4; // -45 to 45 degrees
        const speed = Math.sqrt(this.speedX * this.speedX + this.speedY * this.speedY); // maintain speed
        this.speedX = (Math.random() > 0.5 ? 1 : -1) * speed * Math.cos(angle);
        this.speedY = speed * Math.sin(angle);
    }
}