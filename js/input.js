export class Input {
    constructor() {
        this.keys = {};
        this.justPressed = {};
        this.mouseX = 0;
        this.mouseY = 0;
        this.mouseClicked = false;
        this.mouseDown = false;

        window.addEventListener('keydown', (e) => {
            if (!this.keys[e.code]) {
                this.justPressed[e.code] = true;
            }
            this.keys[e.code] = true;
            e.preventDefault();
        });

        window.addEventListener('keyup', (e) => {
            this.keys[e.code] = false;
            e.preventDefault();
        });

        const canvas = document.getElementById('game-canvas');
        canvas.addEventListener('mousemove', (e) => {
            const rect = canvas.getBoundingClientRect();
            this.mouseX = e.clientX - rect.left;
            this.mouseY = e.clientY - rect.top;
        });

        canvas.addEventListener('mousedown', (e) => {
            this.mouseDown = true;
            this.mouseClicked = true;
        });

        canvas.addEventListener('mouseup', () => {
            this.mouseDown = false;
        });
    }

    isDown(code) {
        return !!this.keys[code];
    }

    wasPressed(code) {
        return !!this.justPressed[code];
    }

    endFrame() {
        this.justPressed = {};
        this.mouseClicked = false;
    }

    getDirection() {
        let dx = 0, dy = 0;
        if (this.isDown('ArrowUp') || this.isDown('KeyW')) dy = -1;
        if (this.isDown('ArrowDown') || this.isDown('KeyS')) dy = 1;
        if (this.isDown('ArrowLeft') || this.isDown('KeyA')) dx = -1;
        if (this.isDown('ArrowRight') || this.isDown('KeyD')) dx = 1;
        return { dx, dy };
    }
}
