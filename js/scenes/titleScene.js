import { CANVAS_WIDTH, CANVAS_HEIGHT, SCENE } from '../constants.js';

export class TitleScene {
    constructor(game) {
        this.game = game;
        this.selectedOption = 0;
        this.options = ['New Game', 'Continue'];
        this.time = 0;
        this.stars = [];
        for (let i = 0; i < 50; i++) {
            this.stars.push({
                x: Math.random() * CANVAS_WIDTH,
                y: Math.random() * CANVAS_HEIGHT * 0.6,
                size: Math.random() * 2 + 1,
                speed: Math.random() * 0.5 + 0.2
            });
        }
    }

    update(dt) {
        this.time += dt;
        const input = this.game.input;

        if (input.wasPressed('ArrowUp') || input.wasPressed('KeyW')) {
            this.selectedOption = (this.selectedOption - 1 + this.options.length) % this.options.length;
        }
        if (input.wasPressed('ArrowDown') || input.wasPressed('KeyS')) {
            this.selectedOption = (this.selectedOption + 1) % this.options.length;
        }

        if (input.wasPressed('Enter') || input.wasPressed('Space')) {
            if (this.selectedOption === 0) {
                this.game.startNewGame();
            } else if (this.selectedOption === 1) {
                // Try to load save
                if (this.game.loadGame()) {
                    // Loaded successfully
                } else {
                    this.game.startNewGame();
                }
            }
        }
    }

    render(ctx) {
        // Background - night sky gradient
        const grad = ctx.createLinearGradient(0, 0, 0, CANVAS_HEIGHT);
        grad.addColorStop(0, '#0a0a2e');
        grad.addColorStop(0.6, '#1a1a4e');
        grad.addColorStop(1, '#2a1a1a');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

        // Stars
        for (const star of this.stars) {
            const alpha = 0.5 + Math.sin(this.time * star.speed * 3) * 0.5;
            ctx.fillStyle = `rgba(255, 255, 255, ${alpha})`;
            ctx.fillRect(star.x, star.y, star.size, star.size);
        }

        // Mountain silhouette
        ctx.fillStyle = '#1a1a3e';
        ctx.beginPath();
        ctx.moveTo(0, 380);
        ctx.lineTo(100, 280);
        ctx.lineTo(200, 320);
        ctx.lineTo(350, 240);
        ctx.lineTo(450, 300);
        ctx.lineTo(550, 250);
        ctx.lineTo(650, 290);
        ctx.lineTo(750, 260);
        ctx.lineTo(800, 300);
        ctx.lineTo(800, 380);
        ctx.closePath();
        ctx.fill();

        // Hokage monument silhouette
        ctx.fillStyle = '#252540';
        ctx.fillRect(250, 270, 300, 110);
        // Faces (simplified)
        ctx.fillStyle = '#2a2a48';
        for (let i = 0; i < 4; i++) {
            ctx.fillRect(260 + i * 70, 280, 55, 70);
        }

        // Title
        const titleY = 100 + Math.sin(this.time * 2) * 5;
        ctx.save();

        // Title shadow
        ctx.fillStyle = '#000';
        ctx.font = 'bold 52px "Segoe UI", sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('NARUTO', CANVAS_WIDTH / 2 + 2, titleY + 2);

        // Title text
        ctx.fillStyle = '#f90';
        ctx.fillText('NARUTO', CANVAS_WIDTH / 2, titleY);

        // Subtitle
        ctx.font = 'bold 22px "Segoe UI", sans-serif';
        ctx.fillStyle = '#e8e8f0';
        ctx.fillText('TACTICAL RPG', CANVAS_WIDTH / 2, titleY + 40);

        // Leaf village symbol (simplified)
        ctx.fillStyle = '#f90';
        ctx.beginPath();
        ctx.arc(CANVAS_WIDTH / 2, titleY + 70, 12, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#0a0a2e';
        ctx.beginPath();
        ctx.arc(CANVAS_WIDTH / 2, titleY + 70, 8, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#f90';
        ctx.beginPath();
        ctx.moveTo(CANVAS_WIDTH / 2, titleY + 62);
        ctx.lineTo(CANVAS_WIDTH / 2 + 3, titleY + 70);
        ctx.lineTo(CANVAS_WIDTH / 2, titleY + 78);
        ctx.lineTo(CANVAS_WIDTH / 2 - 3, titleY + 70);
        ctx.closePath();
        ctx.fill();

        ctx.restore();

        // Menu options
        const menuY = 400;
        ctx.textAlign = 'center';
        for (let i = 0; i < this.options.length; i++) {
            const isSelected = i === this.selectedOption;
            const y = menuY + i * 45;

            if (isSelected) {
                // Selection box
                ctx.fillStyle = 'rgba(255, 153, 0, 0.2)';
                ctx.fillRect(CANVAS_WIDTH / 2 - 100, y - 18, 200, 36);
                ctx.strokeStyle = '#f90';
                ctx.lineWidth = 2;
                ctx.strokeRect(CANVAS_WIDTH / 2 - 100, y - 18, 200, 36);

                // Arrow indicator
                ctx.fillStyle = '#f90';
                ctx.font = '18px "Segoe UI", sans-serif';
                ctx.textAlign = 'right';
                ctx.fillText('\u25B6', CANVAS_WIDTH / 2 - 70, y + 6);
            }

            ctx.fillStyle = isSelected ? '#fff' : '#888';
            ctx.font = `${isSelected ? 'bold ' : ''}20px "Segoe UI", sans-serif`;
            ctx.textAlign = 'center';
            ctx.fillText(this.options[i], CANVAS_WIDTH / 2, y + 7);
        }

        // Controls hint
        ctx.fillStyle = '#555';
        ctx.font = '14px "Segoe UI", sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('Arrow Keys to navigate \u2022 Enter to select', CANVAS_WIDTH / 2, CANVAS_HEIGHT - 30);
        ctx.fillText('WASD to move \u2022 Space to interact', CANVAS_WIDTH / 2, CANVAS_HEIGHT - 12);
    }
}
