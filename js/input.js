export class Input {
    constructor() {
        this.keys = {};
        this.justPressed = {};
        this.mouseX = 0;
        this.mouseY = 0;
        this.mouseClicked = false;
        this.mouseDown = false;

        // Track active touch directions (for D-pad hold behavior)
        this._touchDirs = { dx: 0, dy: 0 };

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

        // ── Mouse events ──
        canvas.addEventListener('mousemove', (e) => {
            const rect = canvas.getBoundingClientRect();
            const scaleX = canvas.width / rect.width;
            const scaleY = canvas.height / rect.height;
            this.mouseX = (e.clientX - rect.left) * scaleX;
            this.mouseY = (e.clientY - rect.top) * scaleY;
        });

        canvas.addEventListener('mousedown', () => {
            this.mouseDown = true;
            this.mouseClicked = true;
        });

        canvas.addEventListener('mouseup', () => {
            this.mouseDown = false;
        });

        // ── Touch events on canvas (for tapping tiles / skill tree nodes) ──
        canvas.addEventListener('touchstart', (e) => {
            e.preventDefault();
            const touch = e.changedTouches[0];
            const rect = canvas.getBoundingClientRect();
            const scaleX = canvas.width / rect.width;
            const scaleY = canvas.height / rect.height;
            this.mouseX = (touch.clientX - rect.left) * scaleX;
            this.mouseY = (touch.clientY - rect.top) * scaleY;
            this.mouseDown = true;
            this.mouseClicked = true;
        }, { passive: false });

        canvas.addEventListener('touchend', (e) => {
            e.preventDefault();
            this.mouseDown = false;
        }, { passive: false });

        canvas.addEventListener('touchmove', (e) => {
            e.preventDefault();
            const touch = e.changedTouches[0];
            const rect = canvas.getBoundingClientRect();
            const scaleX = canvas.width / rect.width;
            const scaleY = canvas.height / rect.height;
            this.mouseX = (touch.clientX - rect.left) * scaleX;
            this.mouseY = (touch.clientY - rect.top) * scaleY;
        }, { passive: false });

        // ── Virtual button bindings ──
        this._setupVirtualControls();
    }

    /**
     * Bind virtual on-screen buttons to keyboard codes.
     * Each button has a data-key attribute (e.g. "Space", "Escape", "KeyT").
     * D-pad buttons have data-dir (e.g. "up", "down", "left", "right").
     */
    _setupVirtualControls() {
        // D-pad buttons
        document.querySelectorAll('[data-dir]').forEach(btn => {
            const dir = btn.getAttribute('data-dir');
            const code = {
                up: 'ArrowUp', down: 'ArrowDown',
                left: 'ArrowLeft', right: 'ArrowRight'
            }[dir];
            if (!code) return;

            btn.addEventListener('touchstart', (e) => {
                e.preventDefault();
                if (!this.keys[code]) this.justPressed[code] = true;
                this.keys[code] = true;
                btn.classList.add('active');
                // Update held direction
                this._updateTouchDirs();
            }, { passive: false });

            btn.addEventListener('touchend', (e) => {
                e.preventDefault();
                this.keys[code] = false;
                btn.classList.remove('active');
                this._updateTouchDirs();
            }, { passive: false });

            btn.addEventListener('touchcancel', (e) => {
                e.preventDefault();
                this.keys[code] = false;
                btn.classList.remove('active');
                this._updateTouchDirs();
            }, { passive: false });
        });

        // Action buttons (A, B, T, Q, E)
        document.querySelectorAll('[data-key]').forEach(btn => {
            const code = btn.getAttribute('data-key');

            btn.addEventListener('touchstart', (e) => {
                e.preventDefault();
                if (!this.keys[code]) this.justPressed[code] = true;
                this.keys[code] = true;
                btn.classList.add('active');
            }, { passive: false });

            btn.addEventListener('touchend', (e) => {
                e.preventDefault();
                this.keys[code] = false;
                btn.classList.remove('active');
            }, { passive: false });

            btn.addEventListener('touchcancel', (e) => {
                e.preventDefault();
                this.keys[code] = false;
                btn.classList.remove('active');
            }, { passive: false });
        });
    }

    _updateTouchDirs() {
        let dx = 0, dy = 0;
        if (this.keys['ArrowUp']) dy = -1;
        if (this.keys['ArrowDown']) dy = 1;
        if (this.keys['ArrowLeft']) dx = -1;
        if (this.keys['ArrowRight']) dx = 1;
        this._touchDirs = { dx, dy };
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
