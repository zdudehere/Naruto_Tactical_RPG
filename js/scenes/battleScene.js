import {
    CANVAS_WIDTH, CANVAS_HEIGHT,
    BATTLE_COLS, BATTLE_ROWS, BATTLE_TILE_SIZE,
    BATTLE_OFFSET_X, BATTLE_OFFSET_Y
} from '../constants.js';
import { getBattleSprite } from '../sprites.js';
import { createCharacter, grantXP } from '../data/characters.js';
import { ENCOUNTERS } from '../data/story.js';

const PHASE = {
    START: 'start',
    PLAYER_SELECT: 'player_select',
    PLAYER_MOVE: 'player_move',
    PLAYER_ACTION: 'player_action',
    PLAYER_TARGET: 'player_target',
    ANIMATING: 'animating',
    ENEMY_TURN: 'enemy_turn',
    VICTORY: 'victory',
    DEFEAT: 'defeat'
};

export class BattleScene {
    constructor(game, encounterId) {
        this.game = game;
        this.encounterId = encounterId;
        this.encounter = ENCOUNTERS[encounterId];

        // Battle grid
        this.grid = [];
        for (let y = 0; y < BATTLE_ROWS; y++) {
            this.grid[y] = [];
            for (let x = 0; x < BATTLE_COLS; x++) {
                this.grid[y][x] = null;
            }
        }

        // Units
        this.allies = [];
        this.enemies = [];
        this.allUnits = [];

        // Turn order
        this.turnOrder = [];
        this.currentTurnIndex = 0;

        // Phase
        this.phase = PHASE.START;
        this.selectedUnit = null;
        this.cursorX = 0;
        this.cursorY = 0;
        this.moveRange = [];
        this.attackRange = [];
        this.selectedAction = null;
        this.selectedJutsu = null;

        // Animation
        this.animations = [];
        this.animTimer = 0;
        this.turnBanner = null;
        this.turnBannerTimer = 0;
        this.floatingTexts = [];
        this.time = 0;

        // Action menu state
        this.actionMenuVisible = false;
        this.jutsuMenuVisible = false;
        this.actionMenuItems = [];
        this.selectedMenuIndex = 0;

        // Message log
        this.messages = [];
        this.messageTimer = 0;

        this.initBattle();
    }

    initBattle() {
        // Place allies
        const party = this.game.party;
        for (let i = 0; i < party.length; i++) {
            const pos = this.encounter.allyPositions[i];
            const unit = party[i];
            unit.gridX = pos.gridX;
            unit.gridY = pos.gridY;
            unit.hasMoved = false;
            unit.hasActed = false;
            this.grid[pos.gridY][pos.gridX] = unit;
            this.allies.push(unit);
        }

        // Create and place enemies
        for (const enemyDef of this.encounter.enemies) {
            const enemy = createCharacter(enemyDef.template, enemyDef.level);
            enemy.gridX = enemyDef.gridX;
            enemy.gridY = enemyDef.gridY;
            this.grid[enemyDef.gridY][enemyDef.gridX] = enemy;
            this.enemies.push(enemy);
        }

        this.allUnits = [...this.allies, ...this.enemies];

        // Calculate turn order by speed
        this.calculateTurnOrder();

        // Show battle start banner
        this.turnBanner = this.encounter.name;
        this.turnBannerTimer = 2;
        this.phase = PHASE.START;

        this.addMessage(this.encounter.name);
    }

    calculateTurnOrder() {
        this.turnOrder = this.allUnits
            .filter(u => u.currentHp > 0)
            .sort((a, b) => b.stats.speed - a.stats.speed);
        this.currentTurnIndex = 0;
    }

    addMessage(text) {
        this.messages.unshift(text);
        if (this.messages.length > 5) this.messages.pop();
        this.messageTimer = 3;
    }

    addFloatingText(x, y, text, color = '#fff') {
        this.floatingTexts.push({
            x: BATTLE_OFFSET_X + x * BATTLE_TILE_SIZE + BATTLE_TILE_SIZE / 2,
            y: BATTLE_OFFSET_Y + y * BATTLE_TILE_SIZE,
            text, color, life: 1.5, vy: -30
        });
    }

    getCurrentUnit() {
        if (this.turnOrder.length === 0) return null;
        return this.turnOrder[this.currentTurnIndex % this.turnOrder.length];
    }

    update(dt) {
        this.time += dt;
        const input = this.game.input;

        // Update floating texts
        this.floatingTexts = this.floatingTexts.filter(ft => {
            ft.y += ft.vy * dt;
            ft.life -= dt;
            return ft.life > 0;
        });

        // Update banner
        if (this.turnBannerTimer > 0) {
            this.turnBannerTimer -= dt;
            if (this.turnBannerTimer <= 0 && this.phase === PHASE.START) {
                this.startNextTurn();
            }
            return;
        }

        // Message timer
        if (this.messageTimer > 0) this.messageTimer -= dt;

        switch (this.phase) {
            case PHASE.PLAYER_SELECT:
                this.updatePlayerSelect(input, dt);
                break;
            case PHASE.PLAYER_MOVE:
                this.updatePlayerMove(input, dt);
                break;
            case PHASE.PLAYER_ACTION:
                this.updatePlayerAction(input, dt);
                break;
            case PHASE.PLAYER_TARGET:
                this.updatePlayerTarget(input, dt);
                break;
            case PHASE.ANIMATING:
                this.updateAnimation(dt);
                break;
            case PHASE.ENEMY_TURN:
                this.updateEnemyTurn(dt);
                break;
            case PHASE.VICTORY:
            case PHASE.DEFEAT:
                if (input.wasPressed('Space') || input.wasPressed('Enter')) {
                    this.endBattle();
                }
                break;
        }
    }

    startNextTurn() {
        // Remove dead units
        this.allUnits = this.allUnits.filter(u => u.currentHp > 0);
        this.allies = this.allies.filter(u => u.currentHp > 0);
        this.enemies = this.enemies.filter(u => u.currentHp > 0);

        // Check win/lose
        if (this.enemies.length === 0) {
            this.phase = PHASE.VICTORY;
            this.addMessage('Victory!');
            return;
        }
        if (this.allies.length === 0) {
            this.phase = PHASE.DEFEAT;
            this.addMessage('Defeat...');
            return;
        }

        // Recalculate turn order if needed
        this.turnOrder = this.allUnits
            .filter(u => u.currentHp > 0)
            .sort((a, b) => b.stats.speed - a.stats.speed);

        // Find next unit that hasn't acted
        let foundUnit = false;
        for (let i = 0; i < this.turnOrder.length; i++) {
            const unit = this.turnOrder[i];
            if (!unit.hasActed || !unit.hasMoved) {
                this.currentTurnIndex = i;
                foundUnit = true;
                break;
            }
        }

        if (!foundUnit) {
            // All units have acted - new round
            for (const unit of this.allUnits) {
                unit.hasMoved = false;
                unit.hasActed = false;
                // Tick down buffs
                unit.buffs = unit.buffs.filter(b => {
                    b.duration--;
                    if (b.duration <= 0) {
                        unit.stats[b.stat] -= b.bonus;
                        return false;
                    }
                    return true;
                });
                // Regenerate a bit of chakra each round
                unit.currentChakra = Math.min(unit.maxChakra, unit.currentChakra + 5);
            }
            this.currentTurnIndex = 0;
        }

        const unit = this.getCurrentUnit();
        if (!unit) return;

        this.turnBanner = `${unit.name}'s Turn`;
        this.turnBannerTimer = 1;

        if (unit.isAlly) {
            this.selectedUnit = unit;
            this.cursorX = unit.gridX;
            this.cursorY = unit.gridY;
            this.phase = PHASE.PLAYER_SELECT;
            this.calculateMoveRange(unit);
        } else {
            this.phase = PHASE.ENEMY_TURN;
            this.enemyThinkTimer = 0.8;
        }
    }

    calculateMoveRange(unit) {
        this.moveRange = [];
        const move = unit.stats.move;
        for (let y = 0; y < BATTLE_ROWS; y++) {
            for (let x = 0; x < BATTLE_COLS; x++) {
                const dist = Math.abs(x - unit.gridX) + Math.abs(y - unit.gridY);
                if (dist <= move && dist > 0 && !this.grid[y][x]) {
                    this.moveRange.push({ x, y });
                }
            }
        }
    }

    calculateAttackRange(unit, range) {
        this.attackRange = [];
        for (let y = 0; y < BATTLE_ROWS; y++) {
            for (let x = 0; x < BATTLE_COLS; x++) {
                const dist = Math.abs(x - unit.gridX) + Math.abs(y - unit.gridY);
                if (dist <= range && dist > 0) {
                    this.attackRange.push({ x, y });
                }
            }
        }
    }

    updatePlayerSelect(input) {
        this.moveCursor(input);

        if (input.wasPressed('Space') || input.wasPressed('Enter')) {
            const unit = this.selectedUnit;
            if (unit && !unit.hasMoved) {
                // Check if cursor is on a valid move tile
                const isValidMove = this.moveRange.some(m => m.x === this.cursorX && m.y === this.cursorY);
                if (isValidMove) {
                    // Move unit
                    this.grid[unit.gridY][unit.gridX] = null;
                    unit.gridX = this.cursorX;
                    unit.gridY = this.cursorY;
                    this.grid[unit.gridY][unit.gridX] = unit;
                    unit.hasMoved = true;
                    this.moveRange = [];
                }
            }
            // Show action menu
            this.showActionMenu();
        }

        // Skip turn
        if (input.wasPressed('Escape')) {
            this.selectedUnit.hasMoved = true;
            this.selectedUnit.hasActed = true;
            this.moveRange = [];
            this.startNextTurn();
        }
    }

    showActionMenu() {
        this.phase = PHASE.PLAYER_ACTION;
        this.actionMenuVisible = true;
        this.jutsuMenuVisible = false;
        this.selectedMenuIndex = 0;
        this.actionMenuItems = ['Attack', 'Jutsu', 'Wait'];
    }

    updatePlayerAction(input) {
        if (this.jutsuMenuVisible) {
            this.updateJutsuMenu(input);
            return;
        }

        if (input.wasPressed('ArrowUp') || input.wasPressed('KeyW')) {
            this.selectedMenuIndex = (this.selectedMenuIndex - 1 + this.actionMenuItems.length) % this.actionMenuItems.length;
        }
        if (input.wasPressed('ArrowDown') || input.wasPressed('KeyS')) {
            this.selectedMenuIndex = (this.selectedMenuIndex + 1) % this.actionMenuItems.length;
        }
        // Also support left/right for horizontal menu
        if (input.wasPressed('ArrowLeft') || input.wasPressed('KeyA')) {
            this.selectedMenuIndex = (this.selectedMenuIndex - 1 + this.actionMenuItems.length) % this.actionMenuItems.length;
        }
        if (input.wasPressed('ArrowRight') || input.wasPressed('KeyD')) {
            this.selectedMenuIndex = (this.selectedMenuIndex + 1) % this.actionMenuItems.length;
        }

        if (input.wasPressed('Space') || input.wasPressed('Enter')) {
            const action = this.actionMenuItems[this.selectedMenuIndex];
            this.handleActionChoice(action);
        }

        if (input.wasPressed('Escape')) {
            this.actionMenuVisible = false;
            this.phase = PHASE.PLAYER_SELECT;
            this.calculateMoveRange(this.selectedUnit);
        }
    }

    handleActionChoice(action) {
        const unit = this.selectedUnit;
        switch (action) {
            case 'Attack':
                this.selectedAction = 'attack';
                this.actionMenuVisible = false;
                this.calculateAttackRange(unit, unit.stats.range);
                this.phase = PHASE.PLAYER_TARGET;
                break;
            case 'Jutsu':
                this.jutsuMenuVisible = true;
                this.selectedMenuIndex = 0;
                break;
            case 'Wait':
                unit.hasActed = true;
                this.actionMenuVisible = false;
                this.startNextTurn();
                break;
        }
    }

    updateJutsuMenu(input) {
        const jutsuList = this.selectedUnit.jutsu;

        if (input.wasPressed('ArrowUp') || input.wasPressed('KeyW')) {
            this.selectedMenuIndex = (this.selectedMenuIndex - 1 + jutsuList.length) % jutsuList.length;
        }
        if (input.wasPressed('ArrowDown') || input.wasPressed('KeyS')) {
            this.selectedMenuIndex = (this.selectedMenuIndex + 1) % jutsuList.length;
        }

        if (input.wasPressed('Space') || input.wasPressed('Enter')) {
            const jutsu = jutsuList[this.selectedMenuIndex];
            if (this.selectedUnit.currentChakra >= jutsu.chakraCost) {
                this.selectedJutsu = jutsu;
                this.selectedAction = 'jutsu';
                this.actionMenuVisible = false;
                this.jutsuMenuVisible = false;

                if (jutsu.area === 'self') {
                    // Self-targeting - execute immediately
                    this.executeAction(this.selectedUnit, this.selectedUnit);
                } else {
                    this.calculateAttackRange(this.selectedUnit, jutsu.range);
                    this.phase = PHASE.PLAYER_TARGET;
                }
            } else {
                this.addMessage('Not enough chakra!');
            }
        }

        if (input.wasPressed('Escape')) {
            this.jutsuMenuVisible = false;
            this.selectedMenuIndex = 0;
        }
    }

    updatePlayerTarget(input) {
        this.moveCursor(input);

        if (input.wasPressed('Space') || input.wasPressed('Enter')) {
            const isInRange = this.attackRange.some(a => a.x === this.cursorX && a.y === this.cursorY);
            if (isInRange) {
                const target = this.grid[this.cursorY][this.cursorX];
                if (target) {
                    this.executeAction(target, this.selectedUnit);
                }
            }
        }

        if (input.wasPressed('Escape')) {
            this.attackRange = [];
            this.showActionMenu();
        }
    }

    executeAction(target, attacker) {
        this.attackRange = [];
        this.phase = PHASE.ANIMATING;
        this.animTimer = 0.8;

        if (this.selectedAction === 'attack') {
            // Basic attack
            const damage = Math.max(1, attacker.stats.attack - target.stats.defense + Math.floor(Math.random() * 4));
            target.currentHp = Math.max(0, target.currentHp - damage);
            this.addFloatingText(target.gridX, target.gridY, `-${damage}`, '#f44');
            this.addMessage(`${attacker.name} attacks ${target.name} for ${damage} damage!`);

            if (target.currentHp <= 0) {
                this.addMessage(`${target.name} is defeated!`);
                this.grid[target.gridY][target.gridX] = null;
            }
        } else if (this.selectedAction === 'jutsu') {
            const jutsu = this.selectedJutsu;
            attacker.currentChakra -= jutsu.chakraCost;

            if (jutsu.type === 'heal') {
                const healAmt = jutsu.power + Math.floor(Math.random() * 8);
                target.currentHp = Math.min(target.maxHp, target.currentHp + healAmt);
                this.addFloatingText(target.gridX, target.gridY, `+${healAmt}`, '#4f4');
                this.addMessage(`${attacker.name} uses ${jutsu.name}! Heals ${target.name} for ${healAmt}!`);
            } else if (jutsu.type === 'buff') {
                const effect = jutsu.effect;
                target.stats[effect.stat] += effect.bonus;
                target.buffs.push({ ...effect });
                this.addFloatingText(target.gridX, target.gridY, `+${effect.stat}`, '#ff0');
                this.addMessage(`${attacker.name} uses ${jutsu.name}! ${target.name}'s ${effect.stat} increased!`);
            } else {
                // Damage jutsu
                let power = jutsu.power;
                let damage;
                if (jutsu.type === 'physical') {
                    damage = Math.max(1, power + attacker.stats.attack - target.stats.defense);
                } else {
                    damage = Math.max(1, power - Math.floor(target.stats.defense * 0.5));
                }
                damage += Math.floor(Math.random() * 6);
                target.currentHp = Math.max(0, target.currentHp - damage);
                this.addFloatingText(target.gridX, target.gridY, `-${damage}`, '#f90');
                this.addMessage(`${attacker.name} uses ${jutsu.name}! ${damage} damage to ${target.name}!`);

                // Area effects
                if (jutsu.area === 'adjacent') {
                    const adj = [[-1,0],[1,0],[0,-1],[0,1]];
                    for (const [dx, dy] of adj) {
                        const nx = target.gridX + dx;
                        const ny = target.gridY + dy;
                        if (nx >= 0 && nx < BATTLE_COLS && ny >= 0 && ny < BATTLE_ROWS) {
                            const adjTarget = this.grid[ny][nx];
                            if (adjTarget && adjTarget !== attacker && !adjTarget.isAlly === !target.isAlly) {
                                const adjDmg = Math.max(1, Math.floor(damage * 0.5));
                                adjTarget.currentHp = Math.max(0, adjTarget.currentHp - adjDmg);
                                this.addFloatingText(nx, ny, `-${adjDmg}`, '#f90');
                            }
                        }
                    }
                }

                if (target.currentHp <= 0) {
                    this.addMessage(`${target.name} is defeated!`);
                    this.grid[target.gridY][target.gridX] = null;
                }
            }
        }

        attacker.hasActed = true;
        if (!attacker.hasMoved) attacker.hasMoved = true;
    }

    updateAnimation(dt) {
        this.animTimer -= dt;
        if (this.animTimer <= 0) {
            this.startNextTurn();
        }
    }

    updateEnemyTurn(dt) {
        if (this.enemyThinkTimer > 0) {
            this.enemyThinkTimer -= dt;
            return;
        }

        const unit = this.getCurrentUnit();
        if (!unit || unit.isAlly) {
            this.startNextTurn();
            return;
        }

        // Simple AI
        this.executeEnemyAI(unit);
    }

    executeEnemyAI(unit) {
        // Find closest ally
        let closestAlly = null;
        let closestDist = Infinity;
        for (const ally of this.allies) {
            if (ally.currentHp <= 0) continue;
            const dist = Math.abs(ally.gridX - unit.gridX) + Math.abs(ally.gridY - unit.gridY);
            if (dist < closestDist) {
                closestDist = dist;
                closestAlly = ally;
            }
        }

        if (!closestAlly) {
            unit.hasActed = true;
            unit.hasMoved = true;
            this.startNextTurn();
            return;
        }

        // Move toward closest ally
        if (!unit.hasMoved) {
            const dx = Math.sign(closestAlly.gridX - unit.gridX);
            const dy = Math.sign(closestAlly.gridY - unit.gridY);
            let moved = 0;
            let nx = unit.gridX;
            let ny = unit.gridY;

            for (let step = 0; step < unit.stats.move; step++) {
                // Try to move closer
                let bestX = nx, bestY = ny;
                let bestDist = Math.abs(closestAlly.gridX - nx) + Math.abs(closestAlly.gridY - ny);

                for (const [ddx, ddy] of [[dx, 0], [0, dy], [-dx, 0], [0, -dy]]) {
                    const tx = nx + ddx;
                    const ty = ny + ddy;
                    if (tx >= 0 && tx < BATTLE_COLS && ty >= 0 && ty < BATTLE_ROWS && !this.grid[ty][tx]) {
                        const d = Math.abs(closestAlly.gridX - tx) + Math.abs(closestAlly.gridY - ty);
                        if (d < bestDist) {
                            bestDist = d;
                            bestX = tx;
                            bestY = ty;
                        }
                    }
                }

                if (bestX !== nx || bestY !== ny) {
                    nx = bestX;
                    ny = bestY;
                    moved++;
                } else {
                    break;
                }
            }

            if (moved > 0) {
                this.grid[unit.gridY][unit.gridX] = null;
                unit.gridX = nx;
                unit.gridY = ny;
                this.grid[ny][nx] = unit;
            }
            unit.hasMoved = true;
        }

        // Try to attack
        const attackDist = Math.abs(closestAlly.gridX - unit.gridX) + Math.abs(closestAlly.gridY - unit.gridY);

        // Check if any jutsu can reach
        let usedJutsu = false;
        if (unit.jutsu && unit.jutsu.length > 0 && unit.ai === 'tactical') {
            for (const jutsu of unit.jutsu) {
                if (jutsu.type === 'buff' && jutsu.area === 'self' && unit.currentChakra >= jutsu.chakraCost) {
                    // Use buff on self
                    unit.currentChakra -= jutsu.chakraCost;
                    const effect = jutsu.effect;
                    unit.stats[effect.stat] += effect.bonus;
                    unit.buffs.push({ ...effect });
                    this.addFloatingText(unit.gridX, unit.gridY, `+${effect.stat}`, '#ff0');
                    this.addMessage(`${unit.name} uses ${jutsu.name}!`);
                    usedJutsu = true;
                    break;
                }
                if (attackDist <= jutsu.range && jutsu.type !== 'buff' && jutsu.type !== 'heal'
                    && unit.currentChakra >= jutsu.chakraCost) {
                    // Use offensive jutsu
                    unit.currentChakra -= jutsu.chakraCost;
                    const power = jutsu.power;
                    const damage = Math.max(1, power - Math.floor(closestAlly.stats.defense * 0.5) + Math.floor(Math.random() * 6));
                    closestAlly.currentHp = Math.max(0, closestAlly.currentHp - damage);
                    this.addFloatingText(closestAlly.gridX, closestAlly.gridY, `-${damage}`, '#f90');
                    this.addMessage(`${unit.name} uses ${jutsu.name}! ${damage} damage to ${closestAlly.name}!`);
                    if (closestAlly.currentHp <= 0) {
                        this.addMessage(`${closestAlly.name} is defeated!`);
                        this.grid[closestAlly.gridY][closestAlly.gridX] = null;
                    }
                    usedJutsu = true;
                    break;
                }
            }
        }

        if (!usedJutsu && attackDist <= unit.stats.range) {
            // Basic attack
            const damage = Math.max(1, unit.stats.attack - closestAlly.stats.defense + Math.floor(Math.random() * 4));
            closestAlly.currentHp = Math.max(0, closestAlly.currentHp - damage);
            this.addFloatingText(closestAlly.gridX, closestAlly.gridY, `-${damage}`, '#f44');
            this.addMessage(`${unit.name} attacks ${closestAlly.name} for ${damage}!`);
            if (closestAlly.currentHp <= 0) {
                this.addMessage(`${closestAlly.name} is defeated!`);
                this.grid[closestAlly.gridY][closestAlly.gridX] = null;
            }
        }

        unit.hasActed = true;
        this.phase = PHASE.ANIMATING;
        this.animTimer = 1;
    }

    endBattle() {
        if (this.phase === PHASE.VICTORY) {
            // Grant XP
            let totalXP = 0;
            for (const enemy of this.encounter.enemies) {
                const template = this.game.getEnemyTemplate(enemy.template);
                if (template) totalXP += template.xpReward || 20;
            }

            const levelUpMessages = [];
            for (const ally of this.game.party) {
                const msgs = grantXP(ally, totalXP);
                levelUpMessages.push(...msgs);
            }

            // Show victory dialogue
            if (this.encounter.victoryDialogue) {
                this.game.returnToOverworld();
                this.game.startDialogue(this.encounter.victoryDialogue);
            } else {
                this.game.returnToOverworld();
            }

            if (levelUpMessages.length > 0) {
                for (const msg of levelUpMessages) {
                    this.addMessage(msg);
                }
            }
        } else {
            // Defeat - restore party HP and return
            for (const ally of this.game.party) {
                ally.currentHp = Math.floor(ally.maxHp * 0.5);
                ally.currentChakra = Math.floor(ally.maxChakra * 0.5);
            }
            this.game.returnToOverworld();
        }
    }

    moveCursor(input) {
        if (input.wasPressed('ArrowUp') || input.wasPressed('KeyW')) {
            this.cursorY = Math.max(0, this.cursorY - 1);
        }
        if (input.wasPressed('ArrowDown') || input.wasPressed('KeyS')) {
            this.cursorY = Math.min(BATTLE_ROWS - 1, this.cursorY + 1);
        }
        if (input.wasPressed('ArrowLeft') || input.wasPressed('KeyA')) {
            this.cursorX = Math.max(0, this.cursorX - 1);
        }
        if (input.wasPressed('ArrowRight') || input.wasPressed('KeyD')) {
            this.cursorX = Math.min(BATTLE_COLS - 1, this.cursorX + 1);
        }

        // Mouse input
        if (this.game.input.mouseClicked) {
            const mx = this.game.input.mouseX - BATTLE_OFFSET_X;
            const my = this.game.input.mouseY - BATTLE_OFFSET_Y;
            const gx = Math.floor(mx / BATTLE_TILE_SIZE);
            const gy = Math.floor(my / BATTLE_TILE_SIZE);
            if (gx >= 0 && gx < BATTLE_COLS && gy >= 0 && gy < BATTLE_ROWS) {
                this.cursorX = gx;
                this.cursorY = gy;
            }
        }
    }

    render(ctx) {
        // Background
        this.renderBackground(ctx);

        // Grid
        this.renderGrid(ctx);

        // Move/attack range highlights
        this.renderRanges(ctx);

        // Units
        this.renderUnits(ctx);

        // Cursor
        this.renderCursor(ctx);

        // Floating texts
        this.renderFloatingTexts(ctx);

        // HUD
        this.renderBattleHUD(ctx);

        // Action menu
        if (this.actionMenuVisible) {
            this.renderActionMenu(ctx);
        }

        // Turn banner
        if (this.turnBannerTimer > 0) {
            this.renderTurnBanner(ctx);
        }

        // Victory/Defeat
        if (this.phase === PHASE.VICTORY || this.phase === PHASE.DEFEAT) {
            this.renderEndScreen(ctx);
        }
    }

    renderBackground(ctx) {
        // Outdoor battle background
        const grad = ctx.createLinearGradient(0, 0, 0, CANVAS_HEIGHT);
        grad.addColorStop(0, '#1a3a1a');
        grad.addColorStop(1, '#2a4a2a');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    }

    renderGrid(ctx) {
        for (let y = 0; y < BATTLE_ROWS; y++) {
            for (let x = 0; x < BATTLE_COLS; x++) {
                const px = BATTLE_OFFSET_X + x * BATTLE_TILE_SIZE;
                const py = BATTLE_OFFSET_Y + y * BATTLE_TILE_SIZE;

                // Checkerboard pattern
                const isLight = (x + y) % 2 === 0;
                ctx.fillStyle = isLight ? '#3a6a32' : '#2d5a28';
                ctx.fillRect(px, py, BATTLE_TILE_SIZE, BATTLE_TILE_SIZE);

                // Grid lines
                ctx.strokeStyle = 'rgba(0,0,0,0.15)';
                ctx.lineWidth = 1;
                ctx.strokeRect(px, py, BATTLE_TILE_SIZE, BATTLE_TILE_SIZE);
            }
        }
    }

    renderRanges(ctx) {
        // Move range (blue)
        for (const m of this.moveRange) {
            const px = BATTLE_OFFSET_X + m.x * BATTLE_TILE_SIZE;
            const py = BATTLE_OFFSET_Y + m.y * BATTLE_TILE_SIZE;
            ctx.fillStyle = 'rgba(50, 100, 255, 0.3)';
            ctx.fillRect(px + 2, py + 2, BATTLE_TILE_SIZE - 4, BATTLE_TILE_SIZE - 4);
            ctx.strokeStyle = 'rgba(50, 100, 255, 0.6)';
            ctx.lineWidth = 1;
            ctx.strokeRect(px + 2, py + 2, BATTLE_TILE_SIZE - 4, BATTLE_TILE_SIZE - 4);
        }

        // Attack range (red)
        for (const a of this.attackRange) {
            const px = BATTLE_OFFSET_X + a.x * BATTLE_TILE_SIZE;
            const py = BATTLE_OFFSET_Y + a.y * BATTLE_TILE_SIZE;
            ctx.fillStyle = 'rgba(255, 50, 50, 0.3)';
            ctx.fillRect(px + 2, py + 2, BATTLE_TILE_SIZE - 4, BATTLE_TILE_SIZE - 4);
            ctx.strokeStyle = 'rgba(255, 50, 50, 0.6)';
            ctx.lineWidth = 1;
            ctx.strokeRect(px + 2, py + 2, BATTLE_TILE_SIZE - 4, BATTLE_TILE_SIZE - 4);
        }
    }

    renderUnits(ctx) {
        for (const unit of this.allUnits) {
            if (unit.currentHp <= 0) continue;

            const px = BATTLE_OFFSET_X + unit.gridX * BATTLE_TILE_SIZE;
            const py = BATTLE_OFFSET_Y + unit.gridY * BATTLE_TILE_SIZE;
            const isSelected = unit === this.selectedUnit && this.phase !== PHASE.ANIMATING;

            const sprite = getBattleSprite(unit.sprite, 'down', Math.floor(this.time * 3) % 4, isSelected);
            ctx.drawImage(sprite, px + 4, py + 4);

            // HP bar above unit
            const barW = BATTLE_TILE_SIZE - 8;
            const barH = 4;
            const barX = px + 4;
            const barY = py - 2;

            ctx.fillStyle = '#333';
            ctx.fillRect(barX, barY, barW, barH);
            const hpPct = unit.currentHp / unit.maxHp;
            ctx.fillStyle = unit.isAlly ? '#4c6' : '#c44';
            ctx.fillRect(barX, barY, barW * hpPct, barH);

            // Unit team indicator
            if (!unit.isAlly) {
                ctx.fillStyle = '#e44';
                ctx.beginPath();
                ctx.arc(px + BATTLE_TILE_SIZE - 6, py + 6, 3, 0, Math.PI * 2);
                ctx.fill();
            }
        }
    }

    renderCursor(ctx) {
        if (this.phase === PHASE.VICTORY || this.phase === PHASE.DEFEAT || this.phase === PHASE.ANIMATING) return;

        const px = BATTLE_OFFSET_X + this.cursorX * BATTLE_TILE_SIZE;
        const py = BATTLE_OFFSET_Y + this.cursorY * BATTLE_TILE_SIZE;
        const pulse = Math.sin(this.time * 5) * 0.3 + 0.7;

        ctx.strokeStyle = `rgba(255, 255, 0, ${pulse})`;
        ctx.lineWidth = 2;
        ctx.strokeRect(px + 1, py + 1, BATTLE_TILE_SIZE - 2, BATTLE_TILE_SIZE - 2);

        // Show info about unit under cursor
        const unitUnder = this.grid[this.cursorY]?.[this.cursorX];
        if (unitUnder) {
            this.renderUnitInfo(ctx, unitUnder);
        }
    }

    renderUnitInfo(ctx, unit) {
        const infoX = CANVAS_WIDTH - 180;
        const infoY = CANVAS_HEIGHT - 150;

        ctx.fillStyle = 'rgba(0,0,0,0.85)';
        ctx.fillRect(infoX, infoY, 170, 140);
        ctx.strokeStyle = unit.isAlly ? '#4a9' : '#e44';
        ctx.lineWidth = 1;
        ctx.strokeRect(infoX, infoY, 170, 140);

        ctx.fillStyle = '#fff';
        ctx.font = 'bold 13px "Segoe UI", sans-serif';
        ctx.textAlign = 'left';
        ctx.fillText(unit.name, infoX + 8, infoY + 18);

        ctx.font = '11px "Segoe UI", sans-serif';
        ctx.fillStyle = '#aaa';
        ctx.fillText(`Level ${unit.level}`, infoX + 8, infoY + 34);

        // HP
        ctx.fillStyle = '#888';
        ctx.fillText('HP', infoX + 8, infoY + 52);
        ctx.fillStyle = '#333';
        ctx.fillRect(infoX + 30, infoY + 44, 100, 8);
        ctx.fillStyle = '#4c6';
        ctx.fillRect(infoX + 30, infoY + 44, 100 * (unit.currentHp / unit.maxHp), 8);
        ctx.fillStyle = '#fff';
        ctx.fillText(`${unit.currentHp}/${unit.maxHp}`, infoX + 135, infoY + 52);

        // Chakra
        ctx.fillStyle = '#888';
        ctx.fillText('CP', infoX + 8, infoY + 68);
        ctx.fillStyle = '#333';
        ctx.fillRect(infoX + 30, infoY + 60, 100, 8);
        ctx.fillStyle = '#48f';
        ctx.fillRect(infoX + 30, infoY + 60, 100 * (unit.currentChakra / unit.maxChakra), 8);
        ctx.fillStyle = '#fff';
        ctx.fillText(`${unit.currentChakra}/${unit.maxChakra}`, infoX + 135, infoY + 68);

        // Stats
        const stats = [
            ['ATK', unit.stats.attack],
            ['DEF', unit.stats.defense],
            ['SPD', unit.stats.speed],
            ['MOV', unit.stats.move]
        ];
        for (let i = 0; i < stats.length; i++) {
            const x = infoX + 8 + (i % 2) * 80;
            const y = infoY + 88 + Math.floor(i / 2) * 20;
            ctx.fillStyle = '#888';
            ctx.fillText(stats[i][0], x, y);
            ctx.fillStyle = '#fff';
            ctx.fillText(stats[i][1], x + 30, y);
        }
    }

    renderBattleHUD(ctx) {
        // Turn order display
        ctx.fillStyle = 'rgba(0,0,0,0.7)';
        ctx.fillRect(0, 0, CANVAS_WIDTH, 24);
        ctx.font = '11px "Segoe UI", sans-serif';
        ctx.textAlign = 'left';
        ctx.fillStyle = '#888';
        ctx.fillText('Turn Order:', 8, 16);

        let tx = 90;
        for (let i = 0; i < Math.min(8, this.turnOrder.length); i++) {
            const unit = this.turnOrder[(this.currentTurnIndex + i) % this.turnOrder.length];
            if (unit.currentHp <= 0) continue;
            const isCurrent = i === 0;
            ctx.fillStyle = isCurrent ? '#ff0' : (unit.isAlly ? '#4a9' : '#e66');
            ctx.fillText(unit.name.split(' ')[0], tx, 16);
            tx += ctx.measureText(unit.name.split(' ')[0]).width + 12;
        }

        // Messages
        if (this.messages.length > 0 && this.messageTimer > 0) {
            ctx.fillStyle = 'rgba(0,0,0,0.7)';
            ctx.fillRect(0, CANVAS_HEIGHT - 28, CANVAS_WIDTH, 28);
            ctx.fillStyle = '#fff';
            ctx.font = '13px "Segoe UI", sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText(this.messages[0], CANVAS_WIDTH / 2, CANVAS_HEIGHT - 10);
        }

        // Phase indicator
        const phaseLabels = {
            [PHASE.PLAYER_SELECT]: 'Select Move',
            [PHASE.PLAYER_MOVE]: 'Choose Destination',
            [PHASE.PLAYER_ACTION]: 'Choose Action',
            [PHASE.PLAYER_TARGET]: 'Choose Target',
            [PHASE.ENEMY_TURN]: 'Enemy Turn...',
        };
        if (phaseLabels[this.phase]) {
            ctx.fillStyle = 'rgba(0,0,0,0.5)';
            ctx.fillRect(CANVAS_WIDTH - 150, 28, 150, 20);
            ctx.fillStyle = '#ccc';
            ctx.font = '11px "Segoe UI", sans-serif';
            ctx.textAlign = 'right';
            ctx.fillText(phaseLabels[this.phase], CANVAS_WIDTH - 8, 43);
        }
    }

    renderActionMenu(ctx) {
        const menuW = 300;
        const menuH = this.jutsuMenuVisible ? 200 : 50;
        const menuX = CANVAS_WIDTH / 2 - menuW / 2;
        const menuY = CANVAS_HEIGHT - 80;

        if (this.jutsuMenuVisible) {
            // Jutsu submenu
            const jutsuList = this.selectedUnit.jutsu;
            const jMenuY = menuY - jutsuList.length * 36 - 10;

            ctx.fillStyle = 'rgba(0,0,0,0.92)';
            ctx.fillRect(menuX, jMenuY, menuW, jutsuList.length * 36 + 10);
            ctx.strokeStyle = '#f90';
            ctx.lineWidth = 1;
            ctx.strokeRect(menuX, jMenuY, menuW, jutsuList.length * 36 + 10);

            for (let i = 0; i < jutsuList.length; i++) {
                const j = jutsuList[i];
                const y = jMenuY + 8 + i * 36;
                const isSelected = i === this.selectedMenuIndex;
                const canAfford = this.selectedUnit.currentChakra >= j.chakraCost;

                if (isSelected) {
                    ctx.fillStyle = 'rgba(255, 153, 0, 0.2)';
                    ctx.fillRect(menuX + 4, y - 2, menuW - 8, 32);
                }

                ctx.fillStyle = canAfford ? (isSelected ? '#fff' : '#ccc') : '#666';
                ctx.font = 'bold 13px "Segoe UI", sans-serif';
                ctx.textAlign = 'left';
                ctx.fillText(j.name, menuX + 12, y + 12);

                ctx.font = '11px "Segoe UI", sans-serif';
                ctx.fillStyle = '#888';
                ctx.fillText(j.description, menuX + 12, y + 26);

                ctx.fillStyle = canAfford ? '#48f' : '#446';
                ctx.textAlign = 'right';
                ctx.fillText(`${j.chakraCost} CP`, menuX + menuW - 12, y + 12);
            }
        }

        // Main action buttons
        const btnW = 90;
        const btnGap = 10;
        const totalW = this.actionMenuItems.length * btnW + (this.actionMenuItems.length - 1) * btnGap;
        const startX = CANVAS_WIDTH / 2 - totalW / 2;

        for (let i = 0; i < this.actionMenuItems.length; i++) {
            const x = startX + i * (btnW + btnGap);
            const isSelected = i === this.selectedMenuIndex && !this.jutsuMenuVisible;

            ctx.fillStyle = isSelected ? '#f90' : 'rgba(0,0,0,0.9)';
            ctx.fillRect(x, menuY, btnW, 36);
            ctx.strokeStyle = '#f90';
            ctx.lineWidth = isSelected ? 2 : 1;
            ctx.strokeRect(x, menuY, btnW, 36);

            ctx.fillStyle = isSelected ? '#000' : '#fff';
            ctx.font = 'bold 14px "Segoe UI", sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText(this.actionMenuItems[i], x + btnW / 2, menuY + 23);
        }
    }

    renderFloatingTexts(ctx) {
        for (const ft of this.floatingTexts) {
            ctx.fillStyle = ft.color;
            ctx.font = 'bold 18px "Segoe UI", sans-serif';
            ctx.textAlign = 'center';
            ctx.globalAlpha = Math.min(1, ft.life);
            ctx.fillText(ft.text, ft.x, ft.y);
            ctx.globalAlpha = 1;
        }
    }

    renderTurnBanner(ctx) {
        const alpha = Math.min(1, this.turnBannerTimer * 2);
        ctx.fillStyle = `rgba(0,0,0,${alpha * 0.6})`;
        ctx.fillRect(0, CANVAS_HEIGHT / 2 - 30, CANVAS_WIDTH, 60);

        ctx.fillStyle = `rgba(255,255,255,${alpha})`;
        ctx.font = 'bold 28px "Segoe UI", sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(this.turnBanner, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 8);
    }

    renderEndScreen(ctx) {
        ctx.fillStyle = 'rgba(0,0,0,0.7)';
        ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

        const isVictory = this.phase === PHASE.VICTORY;
        ctx.fillStyle = isVictory ? '#f90' : '#c44';
        ctx.font = 'bold 48px "Segoe UI", sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(isVictory ? 'VICTORY!' : 'DEFEAT', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 20);

        if (isVictory) {
            let totalXP = 0;
            for (const enemy of this.encounter.enemies) {
                totalXP += 20; // simplified
            }
            ctx.fillStyle = '#fff';
            ctx.font = '18px "Segoe UI", sans-serif';
            ctx.fillText(`+${totalXP} XP earned!`, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 20);
        }

        ctx.fillStyle = '#888';
        ctx.font = '16px "Segoe UI", sans-serif';
        ctx.fillText('Press SPACE to continue', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 60);
    }
}
