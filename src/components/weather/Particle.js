export default class Particle {
  constructor(canvas, ctx, type, isDay) {
    this.canvas = canvas;
    this.ctx = ctx;
    this.type = type;
    this.isDay = isDay;
    this.reset();
  }

  reset() {
    if (!this.canvas) return;
    this.x = Math.random() * this.canvas.width;
    this.y = Math.random() * this.canvas.height;
    if (this.type === "rain") {
      this.vy = Math.random() * 5 + 10;
      this.vx = 0.5;
      this.len = Math.random() * 20 + 10;
    } else if (this.type === "snow") {
      this.vy = Math.random() * 2 + 1;
      this.vx = Math.random() * 2 - 1;
      this.size = Math.random() * 3 + 2;
    } else if (this.type === "stars") {
      this.size = Math.random() * 2;
      this.alpha = Math.random();
      this.fade = Math.random() * 0.02;
    } else if (this.type === "fog") {
      this.vy = Math.random() * 0.3 - 0.15;
      this.vx = Math.random() * 0.4 - 0.2;
      this.size = Math.random() * 80 + 40;
      this.alpha = Math.random() * 0.3 + 0.1;
      this.fadeDirection = Math.random() > 0.5 ? 1 : -1;
    } else if (this.type === "lightning") {
      this.startTime = Date.now();
      this.duration = Math.random() * 200 + 100;
      this.active = true;
      this.x = Math.random() * this.canvas.width;
      this.y = Math.random() * this.canvas.height * 0.5;
    }
  }

  update() {
    if (!this.canvas) return;
    if (this.type === "stars") {
      this.alpha += this.fade;
      if (this.alpha <= 0 || this.alpha >= 1) this.fade = -this.fade;
      return;
    } else if (this.type === "fog") {
      this.x += this.vx;
      this.y += this.vy;
      this.alpha += 0.005 * this.fadeDirection;
      if (this.alpha <= 0.05 || this.alpha >= 0.4) {
        this.fadeDirection = -this.fadeDirection;
      }
      if (this.x < -this.size) this.x = this.canvas.width + this.size;
      if (this.y < -this.size) this.y = this.canvas.height + this.size;
      return;
    } else if (this.type === "lightning") {
      const elapsed = Date.now() - this.startTime;
      if (elapsed > this.duration + 2000) {
        this.reset();
      }
      return;
    }
    this.x += this.vx;
    this.y += this.vy;
    if (this.y > this.canvas.height) {
      this.y = -10;
      this.x = Math.random() * this.canvas.width;
    }
  }

  draw() {
    if (!this.ctx) return;
    this.ctx.beginPath();
    if (this.type === "rain") {
      if (this.isDay) {
        this.ctx.strokeStyle = "rgba(100, 149, 237, 0.6)";
      } else {
        this.ctx.strokeStyle = "rgba(255, 255, 255, 0.5)";
      }
      this.ctx.lineWidth = 1;
      this.ctx.moveTo(this.x, this.y);
      this.ctx.lineTo(this.x + this.vx, this.y + this.len);
      this.ctx.stroke();
    } else if (this.type === "snow") {
      this.ctx.fillStyle = "rgba(255, 255, 255, 0.8)";
      this.ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
      this.ctx.fill();
    } else if (this.type === "stars") {
      this.ctx.fillStyle = `rgba(255, 255, 255, ${this.alpha})`;
      this.ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
      this.ctx.fill();
    } else if (this.type === "fog") {
      const gradient = this.ctx.createRadialGradient(this.x, this.y, 0, this.x, this.y, this.size);
      gradient.addColorStop(0, `rgba(200, 200, 200, ${this.alpha})`);
      gradient.addColorStop(1, `rgba(200, 200, 200, 0)`);
      this.ctx.fillStyle = gradient;
      this.ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
      this.ctx.fill();
    } else if (this.type === "lightning") {
      const elapsed = Date.now() - this.startTime;
      if (elapsed < this.duration) {
        const brightness = Math.max(0, 1 - elapsed / this.duration);
        this.ctx.strokeStyle = `rgba(255, 255, 200, ${brightness})`;
        this.ctx.lineWidth = 3 + Math.random() * 2;
        this.ctx.lineCap = "round";
        
        const segments = 5;
        let currentX = this.x;
        let currentY = this.y;
        
        this.ctx.beginPath();
        this.ctx.moveTo(currentX, currentY);
        
        for (let i = 0; i < segments; i++) {
          currentX += (Math.random() - 0.5) * 60;
          currentY += this.canvas.height / segments + Math.random() * 20;
          this.ctx.lineTo(currentX, currentY);
        }
        
        this.ctx.stroke();
      }
    }
  }
}
