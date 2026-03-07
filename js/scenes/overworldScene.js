import { TILE_SIZE, CANVAS_WIDTH, CANVAS_HEIGHT, TILE, TILE_COLORS, DIR, MOVE_SPEED } from '../constants.js';
import { MAPS, isSolid, getNPCAt, getTriggerAt } from '../data/maps.js';
import { getCharacterSprite, drawTileDecoration, drawBuilding } from '../sprites.js';

export class OverworldScene {
    constructor(game) {
        this.game = game;
        this.mapId = 'konoha';
        this.map = MAPS[this.mapId];

        // Player position in pixels
        this.playerX = this.map.playerStart.x * TILE_SIZE;
        this.playerY = this.map.playerStart.y * TILE_SIZE;
        this.playerDir = 'down';
        this.playerMoving = false;
        this.animFrame = 0;
        this.animTimer = 0;

        // Target tile position for grid-based movement
        this.targetX = this.playerX;
        this.targetY = this.playerY;
        this.isMovingToTarget = false;

        // Camera
        this.cameraX = 0;
        this.cameraY = 0;

        // Interaction cooldown
        this.interactCooldown = 0;

        // Map tile cache
        this.mapCanvas = null;
        this.renderMapCache();
    }

    setMap(mapId, startX, startY) {
        this.mapId = mapId;
        this.map = MAPS[mapId];
        if (startX !== undefined) {
            this.playerX = startX * TILE_SIZE;
            this.playerY = startY * TILE_SIZE;
        } else {
            this.playerX = this.map.playerStart.x * TILE_SIZE;
            this.playerY = this.map.playerStart.y * TILE_SIZE;
        }
        this.targetX = this.playerX;
        this.targetY = this.playerY;
        this.isMovingToTarget = false;
        this.renderMapCache();
    }

    renderMapCache() {
        const map = this.map;
        this.mapCanvas = document.createElement('canvas');
        this.mapCanvas.width = map.width * TILE_SIZE;
        this.mapCanvas.height = map.height * TILE_SIZE;
        const ctx = this.mapCanvas.getContext('2d');

        for (let y = 0; y < map.height; y++) {
            for (let x = 0; x < map.width; x++) {
                const tile = map.tiles[y][x];
                const px = x * TILE_SIZE;
                const py = y * TILE_SIZE;

                // Base tile color
                ctx.fillStyle = TILE_COLORS[tile] || '#333';
                ctx.fillRect(px, py, TILE_SIZE, TILE_SIZE);

                // Tile details
                switch (tile) {
                    case TILE.PATH:
                        // Path texture
                        ctx.fillStyle = 'rgba(0,0,0,0.05)';
                        for (let i = 0; i < 3; i++) {
                            ctx.fillRect(
                                px + Math.random() * TILE_SIZE,
                                py + Math.random() * TILE_SIZE,
                                2, 2
                            );
                        }
                        break;
                    case TILE.WATER:
                        // Water ripples
                        ctx.fillStyle = 'rgba(255,255,255,0.1)';
                        ctx.fillRect(px + 5, py + 10, 8, 2);
                        ctx.fillRect(px + 18, py + 20, 8, 2);
                        break;
                    case TILE.GRASS:
                        // Grass texture
                        ctx.fillStyle = 'rgba(0,0,0,0.05)';
                        ctx.fillRect(px + 4, py + 8, 1, 3);
                        ctx.fillRect(px + 14, py + 4, 1, 3);
                        ctx.fillRect(px + 24, py + 16, 1, 3);
                        break;
                    case TILE.BRIDGE:
                        // Bridge planks
                        ctx.strokeStyle = 'rgba(0,0,0,0.2)';
                        ctx.lineWidth = 1;
                        for (let i = 0; i < TILE_SIZE; i += 8) {
                            ctx.beginPath();
                            ctx.moveTo(px + i, py);
                            ctx.lineTo(px + i, py + TILE_SIZE);
                            ctx.stroke();
                        }
                        break;
                }

                // Decorations
                if (tile === TILE.TREE || tile === TILE.FLOWER || tile === TILE.FENCE) {
                    drawTileDecoration(ctx, tile, px, py, TILE_SIZE);
                }

                // Building roofs
                if (tile === TILE.BUILDING) {
                    ctx.fillStyle = '#6a4a2a';
                    ctx.fillRect(px, py, TILE_SIZE, TILE_SIZE);
                    ctx.strokeStyle = 'rgba(0,0,0,0.3)';
                    ctx.lineWidth = 1;
                    ctx.strokeRect(px, py, TILE_SIZE, TILE_SIZE);
                }

                // Door
                if (tile === TILE.DOOR) {
                    ctx.fillStyle = TILE_COLORS[TILE.WALL];
                    ctx.fillRect(px, py, TILE_SIZE, TILE_SIZE);
                    ctx.fillStyle = '#5a3a1a';
                    ctx.fillRect(px + 8, py + 4, 16, 24);
                    ctx.fillStyle = '#f0c030';
                    ctx.fillRect(px + 20, py + 14, 3, 3);
                }
            }
        }
    }

    update(dt) {
        const input = this.game.input;
        this.interactCooldown = Math.max(0, this.interactCooldown - dt);

        // Handle grid-based movement
        if (this.isMovingToTarget) {
            const dx = this.targetX - this.playerX;
            const dy = this.targetY - this.playerY;
            const dist = Math.sqrt(dx * dx + dy * dy);

            if (dist < MOVE_SPEED) {
                this.playerX = this.targetX;
                this.playerY = this.targetY;
                this.isMovingToTarget = false;
                this.playerMoving = false;

                // Check for triggers at new position
                const tileX = Math.round(this.playerX / TILE_SIZE);
                const tileY = Math.round(this.playerY / TILE_SIZE);
                this.checkTrigger(tileX, tileY);
            } else {
                this.playerX += (dx / dist) * MOVE_SPEED;
                this.playerY += (dy / dist) * MOVE_SPEED;
                this.playerMoving = true;
            }
        } else {
            // Accept new movement input
            const dir = input.getDirection();
            if (dir.dx !== 0 || dir.dy !== 0) {
                // Prioritize one direction
                let moveX = dir.dx;
                let moveY = dir.dy;
                if (moveX !== 0 && moveY !== 0) {
                    moveY = 0; // Prioritize horizontal
                }

                // Update facing direction
                if (moveX < 0) this.playerDir = 'left';
                else if (moveX > 0) this.playerDir = 'right';
                else if (moveY < 0) this.playerDir = 'up';
                else if (moveY > 0) this.playerDir = 'down';

                // Check if target tile is walkable
                const currentTileX = Math.round(this.playerX / TILE_SIZE);
                const currentTileY = Math.round(this.playerY / TILE_SIZE);
                const nextX = currentTileX + moveX;
                const nextY = currentTileY + moveY;

                // Check for NPC blocking
                const npc = getNPCAt(this.mapId, nextX, nextY);

                if (!isSolid(this.mapId, nextX, nextY) && !npc) {
                    this.targetX = nextX * TILE_SIZE;
                    this.targetY = nextY * TILE_SIZE;
                    this.isMovingToTarget = true;
                    this.playerMoving = true;
                }
            }

            // Interaction (talk to NPCs / examine)
            if ((input.wasPressed('Space') || input.wasPressed('Enter')) && this.interactCooldown <= 0) {
                this.interact();
                this.interactCooldown = 0.3;
            }

            // Open Skill Tree
            if (input.wasPressed('KeyT')) {
                this.game.openSkillTree();
            }
        }

        // Animation
        if (this.playerMoving) {
            this.animTimer += dt;
            if (this.animTimer > 0.15) {
                this.animTimer = 0;
                this.animFrame = (this.animFrame + 1) % 4;
            }
        } else {
            this.animFrame = 0;
            this.animTimer = 0;
        }

        // Update camera
        this.updateCamera();
    }

    interact() {
        const tileX = Math.round(this.playerX / TILE_SIZE);
        const tileY = Math.round(this.playerY / TILE_SIZE);

        // Direction offsets for facing
        const offsets = {
            up: { x: 0, y: -1 },
            down: { x: 0, y: 1 },
            left: { x: -1, y: 0 },
            right: { x: 1, y: 0 }
        };
        const off = offsets[this.playerDir];
        const targetX = tileX + off.x;
        const targetY = tileY + off.y;

        // Check for NPC
        const npc = getNPCAt(this.mapId, targetX, targetY);
        if (npc && npc.dialogue) {
            this.game.startDialogue(npc.dialogue);
            return;
        }

        // Check for door/trigger in front
        const trigger = getTriggerAt(this.mapId, targetX, targetY);
        if (trigger) {
            this.handleTrigger(trigger);
        }
    }

    checkTrigger(x, y) {
        const trigger = getTriggerAt(this.mapId, x, y);
        if (trigger) {
            this.handleTrigger(trigger);
        }
    }

    handleTrigger(trigger) {
        if (trigger.type === 'dialogue') {
            this.game.startDialogue(trigger.dialogueId);
        } else if (trigger.type === 'story_check') {
            if (this.game.storyFlags[trigger.storyFlag]) {
                this.game.startDialogue(trigger.elseDialogueId);
            } else {
                this.game.startDialogue(trigger.dialogueId);
            }
        } else if (trigger.type === 'battle') {
            this.game.startBattle(trigger.encounterId);
        }
    }

    updateCamera() {
        // Center camera on player
        const targetCamX = this.playerX - CANVAS_WIDTH / 2 + TILE_SIZE / 2;
        const targetCamY = this.playerY - CANVAS_HEIGHT / 2 + TILE_SIZE / 2;

        // Clamp to map bounds
        const mapW = this.map.width * TILE_SIZE;
        const mapH = this.map.height * TILE_SIZE;
        this.cameraX = Math.max(0, Math.min(targetCamX, mapW - CANVAS_WIDTH));
        this.cameraY = Math.max(0, Math.min(targetCamY, mapH - CANVAS_HEIGHT));

        // Smooth camera
        // this.cameraX += (targetCamX - this.cameraX) * 0.1;
        // this.cameraY += (targetCamY - this.cameraY) * 0.1;
    }

    render(ctx) {
        ctx.save();
        ctx.translate(-Math.round(this.cameraX), -Math.round(this.cameraY));

        // Draw cached map
        if (this.mapCanvas) {
            ctx.drawImage(this.mapCanvas, 0, 0);
        }

        // Draw NPCs
        for (const npc of this.map.npcs) {
            const sprite = getCharacterSprite(npc.sprite, npc.direction, 0);
            ctx.drawImage(sprite, npc.x * TILE_SIZE, npc.y * TILE_SIZE);

            // NPC name label
            ctx.fillStyle = 'rgba(0,0,0,0.6)';
            ctx.font = '10px "Segoe UI", sans-serif';
            ctx.textAlign = 'center';
            const nameW = ctx.measureText(npc.name).width + 6;
            ctx.fillRect(
                npc.x * TILE_SIZE + TILE_SIZE / 2 - nameW / 2,
                npc.y * TILE_SIZE - 10,
                nameW, 12
            );
            ctx.fillStyle = '#fff';
            ctx.fillText(npc.name, npc.x * TILE_SIZE + TILE_SIZE / 2, npc.y * TILE_SIZE);
        }

        // Draw player
        const sprite = getCharacterSprite('naruto', this.playerDir, this.animFrame);
        ctx.drawImage(sprite, Math.round(this.playerX), Math.round(this.playerY));

        ctx.restore();

        // Draw HUD
        this.renderHUD(ctx);
    }

    renderHUD(ctx) {
        // Location name
        ctx.fillStyle = 'rgba(0,0,0,0.6)';
        ctx.fillRect(10, 10, 200, 26);
        ctx.fillStyle = '#f90';
        ctx.font = 'bold 14px "Segoe UI", sans-serif';
        ctx.textAlign = 'left';
        ctx.fillText(this.map.name, 20, 28);

        // Team status (compact)
        const party = this.game.party;
        if (party && party.length > 0) {
            const hudY = CANVAS_HEIGHT - 70;
            ctx.fillStyle = 'rgba(0,0,0,0.7)';
            ctx.fillRect(10, hudY, 250, 60);
            ctx.strokeStyle = '#555';
            ctx.lineWidth = 1;
            ctx.strokeRect(10, hudY, 250, 60);

            for (let i = 0; i < party.length; i++) {
                const c = party[i];
                const x = 20;
                const y = hudY + 8 + i * 18;

                ctx.fillStyle = '#fff';
                ctx.font = '11px "Segoe UI", sans-serif';
                ctx.textAlign = 'left';
                ctx.fillText(c.name.split(' ')[0], x, y + 10);

                // HP bar
                const barX = x + 55;
                const hpPct = c.currentHp / c.maxHp;
                ctx.fillStyle = '#333';
                ctx.fillRect(barX, y + 2, 60, 6);
                ctx.fillStyle = hpPct > 0.5 ? '#4c6' : hpPct > 0.25 ? '#ca4' : '#c44';
                ctx.fillRect(barX, y + 2, 60 * hpPct, 6);

                // Chakra bar
                const cpPct = c.currentChakra / c.maxChakra;
                ctx.fillStyle = '#333';
                ctx.fillRect(barX + 70, y + 2, 60, 6);
                ctx.fillStyle = '#48f';
                ctx.fillRect(barX + 70, y + 2, 60 * cpPct, 6);

                // Level + SP indicator
                ctx.fillStyle = '#888';
                ctx.font = '10px "Segoe UI", sans-serif';
                ctx.fillText(`Lv${c.level}`, barX + 140, y + 10);
                if ((c.skillPoints || 0) > 0) {
                    ctx.fillStyle = '#f0c030';
                    ctx.fillText(`${c.skillPoints}SP`, barX + 170, y + 10);
                }
            }
        }

        // Controls hint
        ctx.fillStyle = 'rgba(0,0,0,0.5)';
        ctx.fillRect(CANVAS_WIDTH - 160, CANVAS_HEIGHT - 24, 150, 18);
        ctx.fillStyle = '#777';
        ctx.font = '10px "Segoe UI", sans-serif';
        ctx.textAlign = 'right';
        ctx.fillText('SPACE: Interact  WASD: Move  T: Skills', CANVAS_WIDTH - 15, CANVAS_HEIGHT - 10);
    }
}
