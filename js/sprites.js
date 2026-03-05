import { CHAR_COLORS, TILE_SIZE } from './constants.js';

// Sprite cache to avoid redrawing every frame
const spriteCache = {};

/**
 * Draw a top-down character sprite procedurally.
 * Each character is drawn as a 32x32 pixel sprite with:
 * - Round head with hair
 * - Headband
 * - Body/outfit
 * - Simple limbs for walk animation
 */
export function getCharacterSprite(name, direction, frame) {
    const key = `${name}_${direction}_${frame}`;
    if (spriteCache[key]) return spriteCache[key];

    const canvas = document.createElement('canvas');
    canvas.width = TILE_SIZE;
    canvas.height = TILE_SIZE;
    const ctx = canvas.getContext('2d');
    const colors = CHAR_COLORS[name] || CHAR_COLORS.enemy_ninja;

    drawCharacter(ctx, colors, direction, frame, name);

    spriteCache[key] = canvas;
    return canvas;
}

function drawCharacter(ctx, colors, direction, frame, name) {
    const cx = 16; // center x
    const walkOffset = Math.sin(frame * Math.PI / 2) * 2;

    // Shadow
    ctx.fillStyle = 'rgba(0,0,0,0.2)';
    ctx.beginPath();
    ctx.ellipse(cx, 30, 8, 3, 0, 0, Math.PI * 2);
    ctx.fill();

    // Body/outfit
    ctx.fillStyle = colors.outfit;
    ctx.fillRect(cx - 6, 14, 12, 12);

    // Arms
    ctx.fillStyle = colors.outfit;
    if (direction === 'left' || direction === 'right') {
        const armY = 15 + Math.abs(walkOffset);
        ctx.fillRect(cx - 8, armY, 3, 8);
        ctx.fillRect(cx + 5, armY, 3, 8);
    } else {
        ctx.fillRect(cx - 9, 15 + walkOffset, 3, 8);
        ctx.fillRect(cx + 6, 15 - walkOffset, 3, 8);
    }

    // Hands
    ctx.fillStyle = colors.skin;
    if (direction === 'left' || direction === 'right') {
        ctx.fillRect(cx - 8, 22 + Math.abs(walkOffset), 3, 2);
        ctx.fillRect(cx + 5, 22 + Math.abs(walkOffset), 3, 2);
    } else {
        ctx.fillRect(cx - 9, 22 + walkOffset, 3, 2);
        ctx.fillRect(cx + 6, 22 - walkOffset, 3, 2);
    }

    // Legs
    ctx.fillStyle = colors.accent;
    const legSpread = walkOffset * 1.5;
    ctx.fillRect(cx - 4, 25, 3, 5);
    ctx.fillRect(cx + 1, 25, 3, 5);
    // Feet
    ctx.fillStyle = '#333';
    if (direction === 'up' || direction === 'down') {
        ctx.fillRect(cx - 4 - legSpread * 0.3, 29, 3, 2);
        ctx.fillRect(cx + 1 + legSpread * 0.3, 29, 3, 2);
    } else {
        ctx.fillRect(cx - 3, 29, 3, 2);
        ctx.fillRect(cx + 1, 29, 3, 2);
    }

    // Collar / outfit accent
    ctx.fillStyle = colors.accent;
    ctx.fillRect(cx - 4, 14, 8, 3);

    // Head
    ctx.fillStyle = colors.skin;
    ctx.beginPath();
    ctx.arc(cx, 9, 7, 0, Math.PI * 2);
    ctx.fill();

    // Hair
    ctx.fillStyle = colors.hair;
    if (direction === 'down') {
        // Hair on top and sides
        ctx.beginPath();
        ctx.arc(cx, 7, 7, Math.PI, Math.PI * 2);
        ctx.fill();
        // Spiky bits
        if (name === 'naruto') {
            drawNarutoHairFront(ctx, cx);
        } else if (name === 'sasuke') {
            drawSasukeHairFront(ctx, cx);
        } else if (name === 'sakura') {
            drawSakuraHairFront(ctx, cx);
        } else {
            // Generic hair
            ctx.fillRect(cx - 7, 3, 14, 5);
        }
    } else if (direction === 'up') {
        // Full hair from back
        ctx.beginPath();
        ctx.arc(cx, 8, 8, 0, Math.PI * 2);
        ctx.fill();
        if (name === 'sasuke') {
            // Sasuke's spiky back hair
            drawTriangle(ctx, cx - 3, 1, cx, -4, cx + 1, 1);
            drawTriangle(ctx, cx + 2, 1, cx + 5, -3, cx + 6, 2);
            drawTriangle(ctx, cx - 6, 2, cx - 5, -3, cx - 2, 1);
        } else if (name === 'naruto') {
            drawTriangle(ctx, cx - 4, 2, cx - 2, -2, cx, 2);
            drawTriangle(ctx, cx, 2, cx + 2, -2, cx + 4, 2);
        }
    } else if (direction === 'left') {
        ctx.beginPath();
        ctx.arc(cx, 7, 7, Math.PI * 0.8, Math.PI * 2.2);
        ctx.fill();
        ctx.fillRect(cx - 1, 2, 6, 5);
    } else {
        ctx.beginPath();
        ctx.arc(cx, 7, 7, Math.PI * 0.8, Math.PI * 2.2);
        ctx.fill();
        ctx.fillRect(cx - 5, 2, 6, 5);
    }

    // Headband
    ctx.fillStyle = colors.headband;
    if (direction === 'down') {
        ctx.fillRect(cx - 7, 5, 14, 3);
        // Metal plate
        ctx.fillStyle = '#c0c0d0';
        ctx.fillRect(cx - 3, 5, 6, 3);
        // Konoha symbol (simple leaf)
        ctx.fillStyle = '#333';
        ctx.fillRect(cx - 1, 6, 2, 1);
    } else if (direction !== 'up') {
        ctx.fillRect(cx - 6, 5, 12, 3);
    }

    // Face features (only when facing down)
    if (direction === 'down') {
        // Eyes
        ctx.fillStyle = '#fff';
        ctx.fillRect(cx - 4, 9, 3, 2);
        ctx.fillRect(cx + 1, 9, 3, 2);

        ctx.fillStyle = '#111';
        ctx.fillRect(cx - 3, 9, 2, 2);
        ctx.fillRect(cx + 2, 9, 2, 2);

        // Special eye for Sasuke
        if (name === 'sasuke') {
            ctx.fillStyle = '#111';
            ctx.fillRect(cx - 3, 9, 2, 2);
            ctx.fillRect(cx + 2, 9, 2, 2);
        }

        // Naruto whisker marks
        if (name === 'naruto') {
            ctx.fillStyle = '#d0a060';
            ctx.fillRect(cx - 6, 11, 3, 1);
            ctx.fillRect(cx + 3, 11, 3, 1);
            ctx.fillRect(cx - 6, 13, 3, 1);
            ctx.fillRect(cx + 3, 13, 3, 1);
        }

        // Mouth
        ctx.fillStyle = '#c08060';
        ctx.fillRect(cx - 1, 13, 2, 1);
    } else if (direction === 'left') {
        // Side face
        ctx.fillStyle = '#fff';
        ctx.fillRect(cx - 4, 9, 3, 2);
        ctx.fillStyle = '#111';
        ctx.fillRect(cx - 4, 9, 2, 2);
    } else if (direction === 'right') {
        ctx.fillStyle = '#fff';
        ctx.fillRect(cx + 1, 9, 3, 2);
        ctx.fillStyle = '#111';
        ctx.fillRect(cx + 2, 9, 2, 2);
    }
}

function drawNarutoHairFront(ctx, cx) {
    ctx.fillRect(cx - 7, 2, 14, 4);
    // Spiky hair
    drawTriangle(ctx, cx - 6, 3, cx - 4, -2, cx - 2, 3);
    drawTriangle(ctx, cx - 2, 3, cx, -3, cx + 2, 3);
    drawTriangle(ctx, cx + 2, 3, cx + 4, -2, cx + 6, 3);
}

function drawSasukeHairFront(ctx, cx) {
    ctx.fillRect(cx - 8, 1, 16, 6);
    // Side bangs
    ctx.fillRect(cx - 8, 5, 4, 6);
    ctx.fillRect(cx + 5, 5, 4, 4);
    // Spiky top
    drawTriangle(ctx, cx - 2, 2, cx, -3, cx + 2, 2);
    drawTriangle(ctx, cx + 3, 2, cx + 6, -4, cx + 7, 3);
    drawTriangle(ctx, cx - 7, 3, cx - 6, -4, cx - 3, 2);
}

function drawSakuraHairFront(ctx, cx) {
    ctx.fillRect(cx - 8, 1, 16, 7);
    // Longer side hair
    ctx.fillRect(cx - 8, 5, 3, 10);
    ctx.fillRect(cx + 5, 5, 3, 10);
    // Headband ribbon on top
    ctx.fillStyle = '#cc2244';
    ctx.fillRect(cx - 4, 3, 8, 2);
}

function drawTriangle(ctx, x1, y1, x2, y2, x3, y3) {
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.lineTo(x3, y3);
    ctx.closePath();
    ctx.fill();
}

/**
 * Draw a battle sprite (larger, more detailed)
 */
export function getBattleSprite(name, direction, frame, isSelected) {
    const key = `battle_${name}_${direction}_${frame}_${isSelected}`;
    if (spriteCache[key]) return spriteCache[key];

    const size = 48;
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');

    // Scale up the regular sprite
    const sprite = getCharacterSprite(name, direction, frame);
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(sprite, 0, 0, size, size);

    // Selection highlight
    if (isSelected) {
        ctx.strokeStyle = '#ff0';
        ctx.lineWidth = 2;
        ctx.strokeRect(1, 1, size - 2, size - 2);
    }

    spriteCache[key] = canvas;
    return canvas;
}

/**
 * Draw tile decorations (trees, flowers, etc.)
 */
export function drawTileDecoration(ctx, type, x, y, size) {
    switch (type) {
        case 5: // TREE
            // Trunk
            ctx.fillStyle = '#5a3a1a';
            ctx.fillRect(x + size * 0.35, y + size * 0.5, size * 0.3, size * 0.4);
            // Canopy
            ctx.fillStyle = '#1a5a12';
            ctx.beginPath();
            ctx.arc(x + size * 0.5, y + size * 0.35, size * 0.38, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = '#2d7a20';
            ctx.beginPath();
            ctx.arc(x + size * 0.45, y + size * 0.3, size * 0.25, 0, Math.PI * 2);
            ctx.fill();
            break;
        case 9: // FLOWER
            ctx.fillStyle = '#3a7d32';
            ctx.fillRect(x, y, size, size);
            // Flowers
            const flowerColors = ['#f44', '#ff0', '#f8f', '#fff'];
            for (let i = 0; i < 3; i++) {
                ctx.fillStyle = flowerColors[i % flowerColors.length];
                const fx = x + 5 + (i * 10);
                const fy = y + 8 + (i % 2) * 10;
                ctx.beginPath();
                ctx.arc(fx, fy, 2, 0, Math.PI * 2);
                ctx.fill();
            }
            break;
        case 8: // FENCE
            ctx.fillStyle = '#7a5a3a';
            ctx.fillRect(x, y + size * 0.3, size, 3);
            ctx.fillRect(x, y + size * 0.6, size, 3);
            ctx.fillRect(x + 4, y + size * 0.2, 3, size * 0.6);
            ctx.fillRect(x + size - 7, y + size * 0.2, 3, size * 0.6);
            break;
    }
}

/**
 * Draw a building with proper top-down perspective
 */
export function drawBuilding(ctx, x, y, w, h, color) {
    // Main building
    ctx.fillStyle = color || '#8b6b4a';
    ctx.fillRect(x, y, w, h);

    // Roof (darker top edge)
    ctx.fillStyle = '#5a3a2a';
    ctx.fillRect(x - 2, y - 2, w + 4, 6);

    // Wall lines
    ctx.strokeStyle = 'rgba(0,0,0,0.2)';
    ctx.lineWidth = 1;
    ctx.strokeRect(x, y, w, h);

    // Window
    if (w >= 64) {
        ctx.fillStyle = '#88ccee';
        ctx.fillRect(x + 8, y + 10, 10, 10);
        ctx.fillRect(x + w - 18, y + 10, 10, 10);
        // Window frames
        ctx.strokeStyle = '#5a3a1a';
        ctx.strokeRect(x + 8, y + 10, 10, 10);
        ctx.strokeRect(x + w - 18, y + 10, 10, 10);
    }
}
