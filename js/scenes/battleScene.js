import {
    CANVAS_WIDTH, CANVAS_HEIGHT,
    BATTLE_COLS, BATTLE_ROWS, BATTLE_TILE_SIZE,
    BATTLE_OFFSET_X, BATTLE_OFFSET_Y
} from '../constants.js';
import { getBattleSprite } from '../sprites.js';
import { createCharacter, grantXP, rollEvasion, calculateDamage } from '../data/characters.js';
import { ENCOUNTERS } from '../data/story.js';

/**
 * TERRITORY BATTLE SYSTEM
 *
 * The battlefield is divided into two territories by a column boundary.
 * - Left side = Ally territory. Right side = Enemy territory.
 * - Units CANNOT move into opposing territory.
 * - PUSH attacks shove enemies further into their side (rightward for enemies).
 * - If pushed off the board, the unit is KO'd.
 * - When no enemies remain in the frontmost enemy column, territory advances.
 * - PULL attacks drag an enemy INTO your territory.
 *   When pulled in, ALL adjacent allies get a free Attack of Opportunity.
 *   Then the victim is flung to the back of the board (rightmost column for enemies).
 * - Low HP (Into the Breach style) means every action has weight.
 */

const PHASE = {
    START: 'start',
    PLAYER_SELECT: 'player_select',
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

        // Battle grid: null = empty, otherwise unit reference
        this.grid = [];
        for (let y = 0; y < BATTLE_ROWS; y++) {
            this.grid[y] = [];
            for (let x = 0; x < BATTLE_COLS; x++) {
                this.grid[y][x] = null;
            }
        }

        // Territory divider: allies own columns [0, territoryLine-1], enemies own [territoryLine, BATTLE_COLS-1]
        this.territoryLine = this.encounter.territoryStart || 6;

        // Units
        this.allies = [];
        this.enemies = [];
        this.allUnits = [];

        // Turn management
        this.turnOrder = [];
        this.currentTurnIndex = 0;
        this.roundNumber = 1;

        // Phase
        this.phase = PHASE.START;
        this.selectedUnit = null;
        this.cursorX = 0;
        this.cursorY = 0;
        this.moveRange = [];
        this.attackRange = [];
        this.selectedAction = null;
        this.selectedJutsu = null;

        // Animation queue
        this.animQueue = [];
        this.animTimer = 0;
        this.currentAnim = null;

        // UI state
        this.turnBanner = null;
        this.turnBannerTimer = 0;
        this.floatingTexts = [];
        this.time = 0;
        this.actionMenuVisible = false;
        this.jutsuMenuVisible = false;
        this.actionMenuItems = [];
        this.selectedMenuIndex = 0;
        this.messages = [];
        this.messageTimer = 0;
        this.territoryFlash = 0; // flash when territory shifts

        // Push/pull animation state
        this.pushAnims = []; // {unit, fromX, fromY, toX, toY, t}

        this.initBattle();
    }

    initBattle() {
        // Place allies in left territory
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

        // Create and place enemies in right territory
        for (const enemyDef of this.encounter.enemies) {
            const enemy = createCharacter(enemyDef.template, enemyDef.level);
            enemy.gridX = enemyDef.gridX;
            enemy.gridY = enemyDef.gridY;
            this.grid[enemyDef.gridY][enemyDef.gridX] = enemy;
            this.enemies.push(enemy);
        }

        this.allUnits = [...this.allies, ...this.enemies];
        this.calculateTurnOrder();

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

    addFloatingText(gridX, gridY, text, color = '#fff', large = false) {
        this.floatingTexts.push({
            x: BATTLE_OFFSET_X + gridX * BATTLE_TILE_SIZE + BATTLE_TILE_SIZE / 2,
            y: BATTLE_OFFSET_Y + gridY * BATTLE_TILE_SIZE,
            text, color, life: 1.8, vy: -40,
            size: large ? 24 : 16
        });
    }

    getCurrentUnit() {
        if (this.turnOrder.length === 0) return null;
        return this.turnOrder[this.currentTurnIndex % this.turnOrder.length];
    }

    // ===================== TERRITORY LOGIC =====================

    /**
     * Check if a column is in ally territory.
     */
    isAllyTerritory(col) {
        return col < this.territoryLine;
    }

    /**
     * Check if a column is in enemy territory.
     */
    isEnemyTerritory(col) {
        return col >= this.territoryLine;
    }

    /**
     * After a push, check if territory should advance.
     * Territory advances when no enemies exist in the frontmost enemy column.
     */
    checkTerritoryAdvance() {
        let advanced = false;
        while (this.territoryLine < BATTLE_COLS) {
            let enemyInFrontCol = false;
            for (let y = 0; y < BATTLE_ROWS; y++) {
                const unit = this.grid[y][this.territoryLine];
                if (unit && !unit.isAlly && unit.currentHp > 0) {
                    enemyInFrontCol = true;
                    break;
                }
            }
            if (!enemyInFrontCol) {
                this.territoryLine++;
                advanced = true;
            } else {
                break;
            }
        }

        // Also check if enemies pushed allies back — enemy territory can shrink
        // (enemies push allies leftward; if no allies in rightmost ally column, territory recedes)
        while (this.territoryLine > 1) {
            let allyInBackCol = false;
            for (let y = 0; y < BATTLE_ROWS; y++) {
                const unit = this.grid[y][this.territoryLine - 1];
                if (unit && unit.isAlly && unit.currentHp > 0) {
                    allyInBackCol = true;
                    break;
                }
            }
            if (!allyInBackCol) {
                // Check if any allies are even further back
                let anyAllyBefore = false;
                for (let x = 0; x < this.territoryLine - 1; x++) {
                    for (let y = 0; y < BATTLE_ROWS; y++) {
                        if (this.grid[y][x]?.isAlly) anyAllyBefore = true;
                    }
                }
                if (anyAllyBefore) break; // Don't shrink if allies are still in territory
                this.territoryLine--;
                advanced = true;
            } else {
                break;
            }
        }

        if (advanced) {
            this.territoryFlash = 1.0;
            this.addMessage(`Territory shifted! Line at column ${this.territoryLine}`);
        }
    }

    /**
     * PUSH a unit in a direction. Returns true if unit was pushed off board (KO).
     * direction: 1 = push right (enemy pushed by ally), -1 = push left (ally pushed by enemy)
     */
    pushUnit(unit, pushAmount, direction) {
        const results = { pushedOff: false, finalX: unit.gridX, tilesMovedThrough: [] };

        for (let i = 0; i < pushAmount; i++) {
            const newX = unit.gridX + direction;

            // Pushed off the board = KO
            if (newX < 0 || newX >= BATTLE_COLS) {
                this.grid[unit.gridY][unit.gridX] = null;
                unit.currentHp = 0;
                results.pushedOff = true;
                this.addFloatingText(unit.gridX, unit.gridY, 'RING OUT!', '#ff4444', true);
                this.addMessage(`${unit.name} was pushed off the battlefield!`);
                return results;
            }

            // Blocked by another unit — stop here and deal 1 collision damage to both
            if (this.grid[unit.gridY][newX]) {
                const blocker = this.grid[unit.gridY][newX];
                blocker.currentHp = Math.max(0, blocker.currentHp - 1);
                unit.currentHp = Math.max(0, unit.currentHp - 1);
                this.addFloatingText(newX, unit.gridY, 'COLLISION -1', '#f90');
                this.addFloatingText(unit.gridX, unit.gridY, '-1', '#f90');
                this.addMessage(`Collision! ${unit.name} and ${blocker.name} take 1 damage!`);

                if (blocker.currentHp <= 0) {
                    this.grid[unit.gridY][newX] = null;
                    this.addMessage(`${blocker.name} is defeated!`);
                }
                if (unit.currentHp <= 0) {
                    this.grid[unit.gridY][unit.gridX] = null;
                    results.pushedOff = true;
                    this.addMessage(`${unit.name} is defeated!`);
                }
                return results;
            }

            // Move the unit
            this.grid[unit.gridY][unit.gridX] = null;
            unit.gridX = newX;
            this.grid[unit.gridY][newX] = unit;
            results.tilesMovedThrough.push(newX);
        }

        results.finalX = unit.gridX;
        return results;
    }

    /**
     * PULL a unit into the puller's territory.
     * Triggers Attack of Opportunity from all adjacent allies.
     * Then unit is flung to the back of their side.
     */
    pullUnit(puller, target) {
        const pullDirection = puller.isAlly ? -1 : 1; // Pull toward puller's side
        const pullToCol = puller.isAlly
            ? Math.max(0, puller.gridX - 1) // Pull into ally territory, near puller
            : Math.min(BATTLE_COLS - 1, puller.gridX + 1);

        // Find empty spot near the pull destination
        let landingX = pullToCol;
        let landingY = target.gridY;

        // Find nearest empty cell
        if (this.grid[landingY][landingX]) {
            let found = false;
            for (let r = 1; r < BATTLE_COLS && !found; r++) {
                for (const dy of [0, -1, 1, -2, 2]) {
                    for (const dx of [0, -1, 1]) {
                        const nx = landingX + dx * r;
                        const ny = landingY + dy;
                        if (nx >= 0 && nx < BATTLE_COLS && ny >= 0 && ny < BATTLE_ROWS && !this.grid[ny][nx]) {
                            landingX = nx;
                            landingY = ny;
                            found = true;
                            break;
                        }
                    }
                    if (found) break;
                }
            }
        }

        // Move target to landing position
        this.grid[target.gridY][target.gridX] = null;
        target.gridX = landingX;
        target.gridY = landingY;
        this.grid[landingY][landingX] = target;

        this.addFloatingText(landingX, landingY, 'PULLED!', '#ff44ff', true);
        this.addMessage(`${target.name} is pulled into ${puller.isAlly ? 'ally' : 'enemy'} territory!`);

        // ATTACK OF OPPORTUNITY: All adjacent allies/enemies of the puller's side get a free hit
        const aooUnits = puller.isAlly ? this.allies : this.enemies;
        let totalAooDmg = 0;
        for (const attacker of aooUnits) {
            if (attacker.currentHp <= 0 || attacker === puller) continue;
            const dist = Math.abs(attacker.gridX - landingX) + Math.abs(attacker.gridY - landingY);
            if (dist <= attacker.stats.range) {
                // Free attack!
                if (rollEvasion(attacker, target)) {
                    this.addFloatingText(landingX, landingY, 'EVADE!', '#44ffff');
                    this.addMessage(`${target.name} evades ${attacker.name}'s AoO!`);
                } else {
                    const dmg = Math.max(1, attacker.stats.attack - target.stats.defense);
                    target.currentHp = Math.max(0, target.currentHp - dmg);
                    totalAooDmg += dmg;
                    this.addFloatingText(landingX, landingY - 0.3 * aooUnits.indexOf(attacker), `AoO -${dmg}`, '#ff6666');
                }
            }
        }

        if (totalAooDmg > 0) {
            this.addMessage(`Attacks of Opportunity deal ${totalAooDmg} total damage to ${target.name}!`);
        }

        // Fling to back of their territory (if still alive)
        if (target.currentHp > 0) {
            const backCol = target.isAlly ? 0 : BATTLE_COLS - 1;
            // Find empty spot at the back
            this.grid[target.gridY][target.gridX] = null;
            let placed = false;
            for (let dy = 0; dy < BATTLE_ROWS && !placed; dy++) {
                for (const yOff of [0, dy, -dy]) {
                    const ny = target.gridY + yOff;
                    if (ny >= 0 && ny < BATTLE_ROWS && !this.grid[ny][backCol]) {
                        target.gridX = backCol;
                        target.gridY = ny;
                        this.grid[ny][backCol] = target;
                        placed = true;
                        break;
                    }
                }
            }
            // If back column is full, find any spot on their back side
            if (!placed) {
                for (let x = (target.isAlly ? 0 : BATTLE_COLS - 1);
                     target.isAlly ? x < this.territoryLine : x >= this.territoryLine;
                     target.isAlly ? x++ : x--) {
                    for (let y = 0; y < BATTLE_ROWS; y++) {
                        if (!this.grid[y][x]) {
                            target.gridX = x;
                            target.gridY = y;
                            this.grid[y][x] = target;
                            placed = true;
                            break;
                        }
                    }
                    if (placed) break;
                }
            }
            this.addFloatingText(target.gridX, target.gridY, 'FLUNG BACK!', '#aa44ff');
            this.addMessage(`${target.name} is flung to the back of the field!`);
        } else {
            this.addMessage(`${target.name} is defeated by Attacks of Opportunity!`);
        }

        this.checkTerritoryAdvance();
    }

    // ===================== UPDATE LOGIC =====================

    update(dt) {
        this.time += dt;
        const input = this.game.input;

        // Update floating texts
        this.floatingTexts = this.floatingTexts.filter(ft => {
            ft.y += ft.vy * dt;
            ft.life -= dt;
            return ft.life > 0;
        });

        // Territory flash
        if (this.territoryFlash > 0) this.territoryFlash -= dt;

        // Banner
        if (this.turnBannerTimer > 0) {
            this.turnBannerTimer -= dt;
            if (this.turnBannerTimer <= 0 && this.phase === PHASE.START) {
                this.startNextTurn();
            }
            return;
        }

        if (this.messageTimer > 0) this.messageTimer -= dt;

        switch (this.phase) {
            case PHASE.PLAYER_SELECT:
                this.updatePlayerSelect(input);
                break;
            case PHASE.PLAYER_ACTION:
                this.updatePlayerAction(input);
                break;
            case PHASE.PLAYER_TARGET:
                this.updatePlayerTarget(input);
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
        // Clean dead units
        this.allUnits = this.allUnits.filter(u => u.currentHp > 0);
        this.allies = this.allies.filter(u => u.currentHp > 0);
        this.enemies = this.enemies.filter(u => u.currentHp > 0);

        // Win/lose check
        if (this.enemies.length === 0) {
            this.phase = PHASE.VICTORY;
            this.addMessage('Victory! Territory secured!');
            return;
        }
        if (this.allies.length === 0) {
            this.phase = PHASE.DEFEAT;
            this.addMessage('Defeat... territory lost.');
            return;
        }

        // Rebuild turn order
        this.turnOrder = this.allUnits
            .filter(u => u.currentHp > 0)
            .sort((a, b) => b.stats.speed - a.stats.speed);

        // Find next unit that hasn't finished their turn
        let foundUnit = false;
        for (let i = 0; i < this.turnOrder.length; i++) {
            const unit = this.turnOrder[i];
            if (!unit.hasActed) {
                this.currentTurnIndex = i;
                foundUnit = true;
                break;
            }
        }

        if (!foundUnit) {
            // New round
            this.roundNumber++;
            for (const unit of this.allUnits) {
                unit.hasMoved = false;
                unit.hasActed = false;
                // Tick buffs
                unit.buffs = unit.buffs.filter(b => {
                    b.duration--;
                    if (b.duration <= 0) {
                        unit.stats[b.stat] -= b.bonus;
                        return false;
                    }
                    return true;
                });
                // Regen 1 chakra per round
                unit.currentChakra = Math.min(unit.maxChakra, unit.currentChakra + 1);
            }
            this.calculateTurnOrder();
        }

        const unit = this.getCurrentUnit();
        if (!unit) return;

        this.turnBanner = `${unit.name}'s Turn`;
        this.turnBannerTimer = 0.8;

        if (unit.isAlly) {
            this.selectedUnit = unit;
            this.cursorX = unit.gridX;
            this.cursorY = unit.gridY;
            this.calculateMoveRange(unit);
            this.phase = PHASE.PLAYER_SELECT;
        } else {
            this.phase = PHASE.ENEMY_TURN;
            this.enemyThinkTimer = 0.6;
        }
    }

    calculateMoveRange(unit) {
        this.moveRange = [];
        const move = unit.stats.move;
        for (let y = 0; y < BATTLE_ROWS; y++) {
            for (let x = 0; x < BATTLE_COLS; x++) {
                const dist = Math.abs(x - unit.gridX) + Math.abs(y - unit.gridY);
                if (dist <= move && dist > 0 && !this.grid[y][x]) {
                    // Territory restriction: can only move within your own territory
                    if (unit.isAlly && this.isAllyTerritory(x)) {
                        this.moveRange.push({ x, y });
                    } else if (!unit.isAlly && this.isEnemyTerritory(x)) {
                        this.moveRange.push({ x, y });
                    }
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

    // ===================== PLAYER INPUT =====================

    updatePlayerSelect(input) {
        this.moveCursor(input);

        if (input.wasPressed('Space') || input.wasPressed('Enter')) {
            const unit = this.selectedUnit;
            // Check if cursor is on a valid move tile
            const isValidMove = this.moveRange.some(m => m.x === this.cursorX && m.y === this.cursorY);
            if (isValidMove) {
                this.grid[unit.gridY][unit.gridX] = null;
                unit.gridX = this.cursorX;
                unit.gridY = this.cursorY;
                this.grid[unit.gridY][unit.gridX] = unit;
                unit.hasMoved = true;
                this.moveRange = [];
            }
            // Show action menu (can act even if didn't move)
            this.showActionMenu();
        }

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

        if (input.wasPressed('ArrowLeft') || input.wasPressed('KeyA') ||
            input.wasPressed('ArrowUp') || input.wasPressed('KeyW')) {
            this.selectedMenuIndex = (this.selectedMenuIndex - 1 + this.actionMenuItems.length) % this.actionMenuItems.length;
        }
        if (input.wasPressed('ArrowRight') || input.wasPressed('KeyD') ||
            input.wasPressed('ArrowDown') || input.wasPressed('KeyS')) {
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
                this.selectedJutsu = null;
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

                if (jutsu.type === 'buff' && (!jutsu.effect || jutsu.range === 0)) {
                    // Self-buff, execute immediately
                    this.executeSelfBuff(this.selectedUnit, jutsu);
                } else if (jutsu.type === 'buff') {
                    // Target ally for buff
                    this.calculateAllyTargetRange(this.selectedUnit, jutsu.range);
                    this.phase = PHASE.PLAYER_TARGET;
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

    calculateAllyTargetRange(unit, range) {
        this.attackRange = [];
        for (let y = 0; y < BATTLE_ROWS; y++) {
            for (let x = 0; x < BATTLE_COLS; x++) {
                const dist = Math.abs(x - unit.gridX) + Math.abs(y - unit.gridY);
                if (dist <= range) {
                    this.attackRange.push({ x, y });
                }
            }
        }
    }

    updatePlayerTarget(input) {
        this.moveCursor(input);

        if (input.wasPressed('Space') || input.wasPressed('Enter')) {
            const isInRange = this.attackRange.some(a => a.x === this.cursorX && a.y === this.cursorY);
            if (isInRange) {
                const target = this.grid[this.cursorY][this.cursorX];
                if (target) {
                    this.executeAction(this.selectedUnit, target);
                }
            }
        }

        if (input.wasPressed('Escape')) {
            this.attackRange = [];
            this.showActionMenu();
        }
    }

    // ===================== ACTION EXECUTION =====================

    executeSelfBuff(unit, jutsu) {
        unit.currentChakra -= jutsu.chakraCost;
        const effect = jutsu.effect;
        unit.stats[effect.stat] += effect.bonus;
        unit.buffs.push({ ...effect });
        this.addFloatingText(unit.gridX, unit.gridY, `+${effect.stat.toUpperCase()}`, '#ffff00', true);
        this.addMessage(`${unit.name} uses ${jutsu.name}!`);
        unit.hasActed = true;
        this.attackRange = [];
        this.phase = PHASE.ANIMATING;
        this.animTimer = 0.8;
    }

    executeAction(attacker, target) {
        this.attackRange = [];
        this.moveRange = [];
        this.phase = PHASE.ANIMATING;
        this.animTimer = 1.0;

        if (this.selectedAction === 'attack') {
            // Basic attack: damage + push
            if (rollEvasion(attacker, target)) {
                this.addFloatingText(target.gridX, target.gridY, 'EVADE!', '#44ffff', true);
                this.addMessage(`${target.name} evades ${attacker.name}'s attack!`);
            } else {
                const dmg = calculateDamage(attacker, target, attacker.stats.attack, 'physical');
                target.currentHp = Math.max(0, target.currentHp - dmg);
                this.addFloatingText(target.gridX, target.gridY, `-${dmg}`, '#ff4444');
                this.addMessage(`${attacker.name} attacks ${target.name} for ${dmg}!`);

                // Push
                if (target.currentHp > 0 && attacker.stats.push > 0) {
                    const pushDir = attacker.isAlly ? 1 : -1; // Allies push right, enemies push left
                    this.pushUnit(target, attacker.stats.push, pushDir);
                }

                if (target.currentHp <= 0) {
                    this.grid[target.gridY]?.[target.gridX] === target && (this.grid[target.gridY][target.gridX] = null);
                    this.addMessage(`${target.name} is defeated!`);
                }

                this.checkTerritoryAdvance();
            }
        } else if (this.selectedAction === 'jutsu') {
            this.executeJutsu(attacker, target, this.selectedJutsu);
        }

        attacker.hasActed = true;
        if (!attacker.hasMoved) attacker.hasMoved = true;
    }

    executeJutsu(attacker, target, jutsu) {
        attacker.currentChakra -= jutsu.chakraCost;

        switch (jutsu.type) {
            case 'heal': {
                const heal = jutsu.power;
                target.currentHp = Math.min(target.maxHp, target.currentHp + heal);
                this.addFloatingText(target.gridX, target.gridY, `+${heal} HP`, '#44ff44', true);
                this.addMessage(`${attacker.name} uses ${jutsu.name}! ${target.name} heals ${heal} HP!`);
                break;
            }

            case 'buff': {
                const effect = jutsu.effect;
                target.stats[effect.stat] += effect.bonus;
                target.buffs.push({ ...effect });
                this.addFloatingText(target.gridX, target.gridY, `+${effect.stat.toUpperCase()}`, '#ffff00', true);
                this.addMessage(`${attacker.name} uses ${jutsu.name} on ${target.name}!`);
                break;
            }

            case 'pull': {
                this.addMessage(`${attacker.name} uses ${jutsu.name}!`);
                this.pullUnit(attacker, target);
                this.animTimer = 1.5; // Longer animation for pull sequence
                break;
            }

            case 'push': {
                // Push-focused jutsu: damage + extra push
                if (rollEvasion(attacker, target)) {
                    this.addFloatingText(target.gridX, target.gridY, 'EVADE!', '#44ffff', true);
                    this.addMessage(`${target.name} evades ${jutsu.name}!`);
                } else {
                    const dmg = calculateDamage(attacker, target, jutsu.power, 'physical');
                    target.currentHp = Math.max(0, target.currentHp - dmg);
                    this.addFloatingText(target.gridX, target.gridY, `-${dmg}`, '#ff8800', true);
                    this.addMessage(`${attacker.name} uses ${jutsu.name}! ${dmg} damage!`);

                    if (target.currentHp > 0 && jutsu.push > 0) {
                        const pushDir = attacker.isAlly ? 1 : -1;
                        this.pushUnit(target, jutsu.push, pushDir);
                    }

                    if (target.currentHp <= 0) {
                        this.grid[target.gridY]?.[target.gridX] === target && (this.grid[target.gridY][target.gridX] = null);
                        this.addMessage(`${target.name} is defeated!`);
                    }

                    this.checkTerritoryAdvance();
                }
                break;
            }

            case 'attack': {
                // Standard damage jutsu (ranged attacks, etc.)
                if (rollEvasion(attacker, target)) {
                    this.addFloatingText(target.gridX, target.gridY, 'EVADE!', '#44ffff', true);
                    this.addMessage(`${target.name} evades ${jutsu.name}!`);
                } else {
                    const dmg = calculateDamage(attacker, target, jutsu.power, 'chakra');
                    target.currentHp = Math.max(0, target.currentHp - dmg);
                    this.addFloatingText(target.gridX, target.gridY, `-${dmg}`, '#ff8800', true);
                    this.addMessage(`${attacker.name} uses ${jutsu.name}! ${dmg} damage!`);

                    if (jutsu.push && jutsu.push > 0 && target.currentHp > 0) {
                        const pushDir = attacker.isAlly ? 1 : -1;
                        this.pushUnit(target, jutsu.push, pushDir);
                    }

                    if (target.currentHp <= 0) {
                        this.grid[target.gridY]?.[target.gridX] === target && (this.grid[target.gridY][target.gridX] = null);
                        this.addMessage(`${target.name} is defeated!`);
                    }

                    this.checkTerritoryAdvance();
                }
                break;
            }

            case 'pierce': {
                // Pierce ignores defense, no evasion
                const dmg = jutsu.power;
                target.currentHp = Math.max(0, target.currentHp - dmg);
                this.addFloatingText(target.gridX, target.gridY, `-${dmg} PIERCE`, '#ffff44', true);
                this.addMessage(`${attacker.name} uses ${jutsu.name}! ${dmg} piercing damage!`);

                if (jutsu.push && jutsu.push > 0 && target.currentHp > 0) {
                    const pushDir = attacker.isAlly ? 1 : -1;
                    this.pushUnit(target, jutsu.push, pushDir);
                }

                if (target.currentHp <= 0) {
                    this.grid[target.gridY]?.[target.gridX] === target && (this.grid[target.gridY][target.gridX] = null);
                    this.addMessage(`${target.name} is defeated!`);
                }

                this.checkTerritoryAdvance();
                break;
            }
        }
    }

    // ===================== ANIMATION =====================

    updateAnimation(dt) {
        this.animTimer -= dt;
        if (this.animTimer <= 0) {
            this.startNextTurn();
        }
    }

    // ===================== ENEMY AI =====================

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

        // Move toward closest ally (within own territory)
        if (!unit.hasMoved) {
            let bestX = unit.gridX, bestY = unit.gridY;
            let bestDist = closestDist;

            for (let step = 0; step < unit.stats.move; step++) {
                let improved = false;
                for (const [dx, dy] of [[-1,0],[1,0],[0,-1],[0,1]]) {
                    const nx = bestX + dx;
                    const ny = bestY + dy;
                    if (nx < 0 || nx >= BATTLE_COLS || ny < 0 || ny >= BATTLE_ROWS) continue;
                    if (!this.isEnemyTerritory(nx)) continue; // Can't enter ally territory
                    if (this.grid[ny][nx] && !(ny === unit.gridY && nx === unit.gridX)) continue;

                    const d = Math.abs(closestAlly.gridX - nx) + Math.abs(closestAlly.gridY - ny);
                    if (d < bestDist) {
                        bestDist = d;
                        bestX = nx;
                        bestY = ny;
                        improved = true;
                    }
                }
                if (!improved) break;
            }

            if (bestX !== unit.gridX || bestY !== unit.gridY) {
                this.grid[unit.gridY][unit.gridX] = null;
                unit.gridX = bestX;
                unit.gridY = bestY;
                this.grid[bestY][bestX] = unit;
            }
            unit.hasMoved = true;
        }

        // Decide action
        const attackDist = Math.abs(closestAlly.gridX - unit.gridX) + Math.abs(closestAlly.gridY - unit.gridY);
        let acted = false;

        // Tactical AI: try jutsu first
        if (unit.ai === 'tactical' && unit.jutsu.length > 0) {
            // Look for high-value plays
            for (const jutsu of unit.jutsu) {
                if (unit.currentChakra < jutsu.chakraCost) continue;

                if (jutsu.type === 'pull' && attackDist <= jutsu.range) {
                    // Pull is very powerful — use it
                    this.addMessage(`${unit.name} uses ${jutsu.name}!`);
                    unit.currentChakra -= jutsu.chakraCost;
                    this.pullUnit(unit, closestAlly);
                    acted = true;
                    break;
                }

                if (jutsu.type === 'buff' && jutsu.range === 0 && unit.buffs.length === 0) {
                    // Self-buff if no buffs active
                    this.executeSelfBuff(unit, jutsu);
                    // executeSelfBuff sets hasActed, but we handle it below
                    acted = true;
                    break;
                }

                if ((jutsu.type === 'attack' || jutsu.type === 'push' || jutsu.type === 'pierce')
                    && attackDist <= jutsu.range) {
                    // Use offensive jutsu
                    unit.currentChakra -= jutsu.chakraCost;
                    this.selectedJutsu = jutsu;

                    // Inline jutsu execution for AI
                    if (jutsu.type === 'pierce') {
                        const dmg = jutsu.power;
                        closestAlly.currentHp = Math.max(0, closestAlly.currentHp - dmg);
                        this.addFloatingText(closestAlly.gridX, closestAlly.gridY, `-${dmg} PIERCE`, '#ffff44', true);
                        this.addMessage(`${unit.name} uses ${jutsu.name}! ${dmg} piercing damage!`);
                    } else if (rollEvasion(unit, closestAlly)) {
                        this.addFloatingText(closestAlly.gridX, closestAlly.gridY, 'EVADE!', '#44ffff', true);
                        this.addMessage(`${closestAlly.name} evades ${jutsu.name}!`);
                    } else {
                        const dmg = calculateDamage(unit, closestAlly, jutsu.power, jutsu.type);
                        closestAlly.currentHp = Math.max(0, closestAlly.currentHp - dmg);
                        this.addFloatingText(closestAlly.gridX, closestAlly.gridY, `-${dmg}`, '#ff8800', true);
                        this.addMessage(`${unit.name} uses ${jutsu.name}! ${dmg} damage!`);

                        if (jutsu.push && jutsu.push > 0 && closestAlly.currentHp > 0) {
                            this.pushUnit(closestAlly, jutsu.push, -1); // Push ally left
                        }
                    }

                    if (closestAlly.currentHp <= 0) {
                        this.grid[closestAlly.gridY]?.[closestAlly.gridX] === closestAlly &&
                            (this.grid[closestAlly.gridY][closestAlly.gridX] = null);
                        this.addMessage(`${closestAlly.name} is defeated!`);
                    }

                    this.checkTerritoryAdvance();
                    acted = true;
                    break;
                }
            }
        }

        // Basic attack if in range and haven't acted
        if (!acted && attackDist <= unit.stats.range) {
            if (rollEvasion(unit, closestAlly)) {
                this.addFloatingText(closestAlly.gridX, closestAlly.gridY, 'EVADE!', '#44ffff', true);
                this.addMessage(`${closestAlly.name} evades ${unit.name}'s attack!`);
            } else {
                const dmg = calculateDamage(unit, closestAlly, unit.stats.attack, 'physical');
                closestAlly.currentHp = Math.max(0, closestAlly.currentHp - dmg);
                this.addFloatingText(closestAlly.gridX, closestAlly.gridY, `-${dmg}`, '#ff4444');
                this.addMessage(`${unit.name} attacks ${closestAlly.name} for ${dmg}!`);

                // Push ally left (enemy pushes toward ally back)
                if (closestAlly.currentHp > 0 && unit.stats.push > 0) {
                    this.pushUnit(closestAlly, unit.stats.push, -1);
                }

                if (closestAlly.currentHp <= 0) {
                    this.grid[closestAlly.gridY]?.[closestAlly.gridX] === closestAlly &&
                        (this.grid[closestAlly.gridY][closestAlly.gridX] = null);
                    this.addMessage(`${closestAlly.name} is defeated!`);
                }

                this.checkTerritoryAdvance();
            }
        }

        unit.hasActed = true;
        this.phase = PHASE.ANIMATING;
        this.animTimer = 1.0;
    }

    endBattle() {
        if (this.phase === PHASE.VICTORY) {
            let totalXP = 0;
            for (const enemy of this.encounter.enemies) {
                const template = this.game.getEnemyTemplate(enemy.template);
                if (template) totalXP += template.xpReward || 15;
            }

            for (const ally of this.game.party) {
                grantXP(ally, totalXP);
            }

            if (this.encounter.victoryDialogue) {
                this.game.returnToOverworld();
                this.game.startDialogue(this.encounter.victoryDialogue);
            } else {
                this.game.returnToOverworld();
            }
        } else {
            for (const ally of this.game.party) {
                ally.currentHp = Math.max(1, Math.floor(ally.maxHp * 0.5));
                ally.currentChakra = Math.floor(ally.maxChakra * 0.5);
            }
            this.game.returnToOverworld();
        }
    }

    // ===================== INPUT HELPERS =====================

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

    // ===================== RENDERING =====================

    render(ctx) {
        this.renderBackground(ctx);
        this.renderGrid(ctx);
        this.renderTerritoryLine(ctx);
        this.renderRanges(ctx);
        this.renderUnits(ctx);
        this.renderCursor(ctx);
        this.renderFloatingTexts(ctx);
        this.renderBattleHUD(ctx);

        if (this.actionMenuVisible) {
            this.renderActionMenu(ctx);
        }

        if (this.turnBannerTimer > 0) {
            this.renderTurnBanner(ctx);
        }

        if (this.phase === PHASE.VICTORY || this.phase === PHASE.DEFEAT) {
            this.renderEndScreen(ctx);
        }
    }

    renderBackground(ctx) {
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

                const isLight = (x + y) % 2 === 0;
                const isAllyTerr = this.isAllyTerritory(x);

                if (isAllyTerr) {
                    ctx.fillStyle = isLight ? '#2a5a6a' : '#1e4a5a'; // Blue-tinted for ally
                } else {
                    ctx.fillStyle = isLight ? '#6a3a2a' : '#5a2e1e'; // Red-tinted for enemy
                }
                ctx.fillRect(px, py, BATTLE_TILE_SIZE, BATTLE_TILE_SIZE);

                ctx.strokeStyle = 'rgba(0,0,0,0.15)';
                ctx.lineWidth = 1;
                ctx.strokeRect(px, py, BATTLE_TILE_SIZE, BATTLE_TILE_SIZE);
            }
        }
    }

    renderTerritoryLine(ctx) {
        const lineX = BATTLE_OFFSET_X + this.territoryLine * BATTLE_TILE_SIZE;
        const topY = BATTLE_OFFSET_Y;
        const bottomY = BATTLE_OFFSET_Y + BATTLE_ROWS * BATTLE_TILE_SIZE;

        // Pulsing territory line
        const pulse = Math.sin(this.time * 3) * 0.3 + 0.7;
        const flashBoost = Math.max(0, this.territoryFlash);

        ctx.strokeStyle = `rgba(255, 255, 0, ${Math.min(1, pulse + flashBoost)})`;
        ctx.lineWidth = 3;
        ctx.setLineDash([8, 4]);
        ctx.beginPath();
        ctx.moveTo(lineX, topY);
        ctx.lineTo(lineX, bottomY);
        ctx.stroke();
        ctx.setLineDash([]);

        // Territory flash effect
        if (flashBoost > 0) {
            ctx.fillStyle = `rgba(255, 255, 0, ${flashBoost * 0.15})`;
            ctx.fillRect(BATTLE_OFFSET_X, topY,
                this.territoryLine * BATTLE_TILE_SIZE, BATTLE_ROWS * BATTLE_TILE_SIZE);
        }

        // Territory labels
        ctx.font = 'bold 10px "Segoe UI", sans-serif';
        ctx.textAlign = 'center';
        ctx.fillStyle = 'rgba(100, 200, 255, 0.6)';
        ctx.fillText('ALLY TERRITORY', BATTLE_OFFSET_X + (this.territoryLine * BATTLE_TILE_SIZE) / 2, topY - 5);
        ctx.fillStyle = 'rgba(255, 100, 100, 0.6)';
        ctx.fillText('ENEMY TERRITORY',
            BATTLE_OFFSET_X + this.territoryLine * BATTLE_TILE_SIZE + ((BATTLE_COLS - this.territoryLine) * BATTLE_TILE_SIZE) / 2,
            topY - 5);
    }

    renderRanges(ctx) {
        // Move range (blue)
        for (const m of this.moveRange) {
            const px = BATTLE_OFFSET_X + m.x * BATTLE_TILE_SIZE;
            const py = BATTLE_OFFSET_Y + m.y * BATTLE_TILE_SIZE;
            ctx.fillStyle = 'rgba(50, 150, 255, 0.35)';
            ctx.fillRect(px + 2, py + 2, BATTLE_TILE_SIZE - 4, BATTLE_TILE_SIZE - 4);
            ctx.strokeStyle = 'rgba(50, 150, 255, 0.7)';
            ctx.lineWidth = 2;
            ctx.strokeRect(px + 2, py + 2, BATTLE_TILE_SIZE - 4, BATTLE_TILE_SIZE - 4);
        }

        // Attack/target range
        for (const a of this.attackRange) {
            const px = BATTLE_OFFSET_X + a.x * BATTLE_TILE_SIZE;
            const py = BATTLE_OFFSET_Y + a.y * BATTLE_TILE_SIZE;

            // Different color for heal/buff targeting
            const isHealTarget = this.selectedJutsu && (this.selectedJutsu.type === 'heal' || this.selectedJutsu.type === 'buff');
            const isPullTarget = this.selectedJutsu && this.selectedJutsu.type === 'pull';

            if (isHealTarget) {
                ctx.fillStyle = 'rgba(50, 255, 50, 0.3)';
                ctx.strokeStyle = 'rgba(50, 255, 50, 0.7)';
            } else if (isPullTarget) {
                ctx.fillStyle = 'rgba(200, 50, 255, 0.3)';
                ctx.strokeStyle = 'rgba(200, 50, 255, 0.7)';
            } else {
                ctx.fillStyle = 'rgba(255, 50, 50, 0.3)';
                ctx.strokeStyle = 'rgba(255, 50, 50, 0.7)';
            }
            ctx.fillRect(px + 2, py + 2, BATTLE_TILE_SIZE - 4, BATTLE_TILE_SIZE - 4);
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

            // Direction: allies face right, enemies face left
            const dir = unit.isAlly ? 'right' : 'left';
            const sprite = getBattleSprite(unit.sprite, dir, Math.floor(this.time * 3) % 4, isSelected);
            ctx.drawImage(sprite, px + 4, py + 4);

            // HP pips (Into the Breach style — discrete HP blocks)
            const pipSize = 6;
            const pipGap = 2;
            const totalPipWidth = unit.maxHp * (pipSize + pipGap) - pipGap;
            const pipStartX = px + (BATTLE_TILE_SIZE - totalPipWidth) / 2;
            const pipY = py - 4;

            for (let i = 0; i < unit.maxHp; i++) {
                const pipX = pipStartX + i * (pipSize + pipGap);
                ctx.fillStyle = i < unit.currentHp
                    ? (unit.isAlly ? '#44cc66' : '#cc4444')
                    : '#333';
                ctx.fillRect(pipX, pipY, pipSize, 4);
                ctx.strokeStyle = 'rgba(0,0,0,0.5)';
                ctx.lineWidth = 0.5;
                ctx.strokeRect(pipX, pipY, pipSize, 4);
            }

            // Chakra pips (smaller, blue)
            if (unit.maxChakra > 0) {
                const cpSize = 4;
                const cpGap = 1;
                const totalCpWidth = unit.maxChakra * (cpSize + cpGap) - cpGap;
                const cpStartX = px + (BATTLE_TILE_SIZE - totalCpWidth) / 2;
                const cpY = py - 9;

                for (let i = 0; i < unit.maxChakra; i++) {
                    const cpX = cpStartX + i * (cpSize + cpGap);
                    ctx.fillStyle = i < unit.currentChakra ? '#4488ff' : '#222';
                    ctx.fillRect(cpX, cpY, cpSize, 3);
                }
            }

            // Buff indicators
            if (unit.buffs.length > 0) {
                const buffPulse = Math.sin(this.time * 4) * 0.5 + 0.5;
                ctx.fillStyle = `rgba(255, 255, 0, ${0.3 + buffPulse * 0.3})`;
                ctx.beginPath();
                ctx.arc(px + BATTLE_TILE_SIZE - 6, py + BATTLE_TILE_SIZE - 6, 4, 0, Math.PI * 2);
                ctx.fill();
            }

            // Push direction indicator
            if (isSelected || (this.phase === PHASE.PLAYER_TARGET && this.cursorX === unit.gridX && this.cursorY === unit.gridY)) {
                if (unit.stats.push > 0) {
                    ctx.fillStyle = 'rgba(255, 153, 0, 0.7)';
                    ctx.font = 'bold 10px "Segoe UI", sans-serif';
                    ctx.textAlign = 'center';
                    const arrowDir = unit.isAlly ? '\u2192' : '\u2190';
                    ctx.fillText(`Push ${unit.stats.push}${arrowDir}`, px + BATTLE_TILE_SIZE / 2, py + BATTLE_TILE_SIZE + 10);
                }
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

        // Unit info panel
        const unitUnder = this.grid[this.cursorY]?.[this.cursorX];
        if (unitUnder) {
            this.renderUnitInfo(ctx, unitUnder);
        }

        // Show territory info
        ctx.font = '10px "Segoe UI", sans-serif';
        ctx.textAlign = 'left';
        ctx.fillStyle = this.isAllyTerritory(this.cursorX) ? '#88ccff' : '#ff8888';
        ctx.fillText(this.isAllyTerritory(this.cursorX) ? 'Ally Territory' : 'Enemy Territory',
            BATTLE_OFFSET_X, CANVAS_HEIGHT - 5);
    }

    renderUnitInfo(ctx, unit) {
        const infoX = CANVAS_WIDTH - 195;
        const infoY = CANVAS_HEIGHT - 185;
        const infoW = 185;
        const infoH = 175;

        ctx.fillStyle = 'rgba(0,0,0,0.9)';
        ctx.fillRect(infoX, infoY, infoW, infoH);
        ctx.strokeStyle = unit.isAlly ? '#4a9' : '#e44';
        ctx.lineWidth = 2;
        ctx.strokeRect(infoX, infoY, infoW, infoH);

        let y = infoY + 16;

        // Name
        ctx.fillStyle = '#fff';
        ctx.font = 'bold 13px "Segoe UI", sans-serif';
        ctx.textAlign = 'left';
        ctx.fillText(unit.name, infoX + 8, y);
        ctx.fillStyle = '#888';
        ctx.font = '11px "Segoe UI", sans-serif';
        ctx.fillText(`Lv.${unit.level}`, infoX + infoW - 35, y);
        y += 18;

        // HP pips in info panel
        ctx.fillStyle = '#888';
        ctx.fillText('HP', infoX + 8, y);
        for (let i = 0; i < unit.maxHp; i++) {
            ctx.fillStyle = i < unit.currentHp ? '#4c6' : '#333';
            ctx.fillRect(infoX + 30 + i * 12, y - 8, 10, 10);
            ctx.strokeStyle = '#555';
            ctx.lineWidth = 0.5;
            ctx.strokeRect(infoX + 30 + i * 12, y - 8, 10, 10);
        }
        y += 16;

        // Chakra pips
        ctx.fillStyle = '#888';
        ctx.fillText('CP', infoX + 8, y);
        for (let i = 0; i < unit.maxChakra; i++) {
            ctx.fillStyle = i < unit.currentChakra ? '#48f' : '#333';
            ctx.fillRect(infoX + 30 + i * 12, y - 8, 10, 10);
            ctx.strokeStyle = '#555';
            ctx.lineWidth = 0.5;
            ctx.strokeRect(infoX + 30 + i * 12, y - 8, 10, 10);
        }
        y += 18;

        // Stats in compact grid
        const stats = [
            ['ATK', unit.stats.attack, '#f88'],
            ['DEF', unit.stats.defense, '#88f'],
            ['SPD', unit.stats.speed, '#8f8'],
            ['EVA', Math.min(75, unit.stats.evasion + unit.stats.speed * 2) + '%', '#ff8'],
            ['MOV', unit.stats.move, '#aaa'],
            ['PUSH', unit.stats.push, '#f90']
        ];

        for (let i = 0; i < stats.length; i++) {
            const sx = infoX + 8 + (i % 3) * 58;
            const sy = y + Math.floor(i / 3) * 16;
            ctx.fillStyle = '#666';
            ctx.font = '9px "Segoe UI", sans-serif';
            ctx.fillText(stats[i][0], sx, sy);
            ctx.fillStyle = stats[i][2];
            ctx.font = 'bold 11px "Segoe UI", sans-serif';
            ctx.fillText(stats[i][1], sx + 28, sy);
        }
        y += 38;

        // Buffs
        if (unit.buffs.length > 0) {
            ctx.fillStyle = '#ff0';
            ctx.font = '10px "Segoe UI", sans-serif';
            const buffText = unit.buffs.map(b => `${b.stat}+${b.bonus}(${b.duration}t)`).join(' ');
            ctx.fillText(buffText, infoX + 8, y);
        }
    }

    renderBattleHUD(ctx) {
        // Top bar: turn order + round
        ctx.fillStyle = 'rgba(0,0,0,0.8)';
        ctx.fillRect(0, 0, CANVAS_WIDTH, 28);

        ctx.font = 'bold 11px "Segoe UI", sans-serif';
        ctx.textAlign = 'left';
        ctx.fillStyle = '#f90';
        ctx.fillText(`Round ${this.roundNumber}`, 8, 18);

        ctx.fillStyle = '#888';
        ctx.fillText('Turn:', 80, 18);

        let tx = 115;
        for (let i = 0; i < Math.min(10, this.turnOrder.length); i++) {
            const unit = this.turnOrder[(this.currentTurnIndex + i) % this.turnOrder.length];
            if (unit.currentHp <= 0) continue;
            const isCurrent = i === 0;
            const name = unit.name.split(' ')[0];
            ctx.fillStyle = isCurrent ? '#ff0' : (unit.isAlly ? '#88ccff' : '#ff8888');
            ctx.font = `${isCurrent ? 'bold ' : ''}10px "Segoe UI", sans-serif`;
            ctx.fillText(name, tx, 18);
            tx += ctx.measureText(name).width + 8;
        }

        // Territory control bar
        const barX = BATTLE_OFFSET_X;
        const barY = 32;
        const barW = BATTLE_COLS * BATTLE_TILE_SIZE;
        const barH = 8;
        const allyPct = this.territoryLine / BATTLE_COLS;

        ctx.fillStyle = '#1e4a5a';
        ctx.fillRect(barX, barY, barW * allyPct, barH);
        ctx.fillStyle = '#5a2e1e';
        ctx.fillRect(barX + barW * allyPct, barY, barW * (1 - allyPct), barH);
        ctx.strokeStyle = '#ff0';
        ctx.lineWidth = 1;
        ctx.strokeRect(barX, barY, barW, barH);

        ctx.fillStyle = '#fff';
        ctx.font = '8px "Segoe UI", sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(`${Math.round(allyPct * 100)}%`, barX + barW * allyPct / 2, barY + 7);
        ctx.fillText(`${Math.round((1 - allyPct) * 100)}%`, barX + barW * allyPct + barW * (1 - allyPct) / 2, barY + 7);

        // Messages
        if (this.messages.length > 0 && this.messageTimer > 0) {
            ctx.fillStyle = 'rgba(0,0,0,0.8)';
            ctx.fillRect(0, CANVAS_HEIGHT - 28, CANVAS_WIDTH, 28);
            ctx.fillStyle = '#fff';
            ctx.font = '13px "Segoe UI", sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText(this.messages[0], CANVAS_WIDTH / 2, CANVAS_HEIGHT - 10);
        }

        // Phase indicator
        const phaseLabels = {
            [PHASE.PLAYER_SELECT]: 'Move (WASD) \u2192 SPACE to confirm',
            [PHASE.PLAYER_ACTION]: 'Choose Action',
            [PHASE.PLAYER_TARGET]: 'Choose Target \u2192 SPACE to confirm',
            [PHASE.ENEMY_TURN]: 'Enemy Turn...',
        };
        if (phaseLabels[this.phase]) {
            ctx.fillStyle = 'rgba(0,0,0,0.6)';
            const labelW = 220;
            ctx.fillRect(CANVAS_WIDTH - labelW - 5, CANVAS_HEIGHT - 50, labelW, 18);
            ctx.fillStyle = '#ccc';
            ctx.font = '11px "Segoe UI", sans-serif';
            ctx.textAlign = 'right';
            ctx.fillText(phaseLabels[this.phase], CANVAS_WIDTH - 10, CANVAS_HEIGHT - 37);
        }
    }

    renderActionMenu(ctx) {
        const menuW = 300;
        const menuX = CANVAS_WIDTH / 2 - menuW / 2;
        const menuY = CANVAS_HEIGHT - 80;

        if (this.jutsuMenuVisible) {
            const jutsuList = this.selectedUnit.jutsu;
            const jMenuY = menuY - jutsuList.length * 40 - 10;

            ctx.fillStyle = 'rgba(0,0,0,0.95)';
            ctx.fillRect(menuX, jMenuY, menuW, jutsuList.length * 40 + 10);
            ctx.strokeStyle = '#f90';
            ctx.lineWidth = 1;
            ctx.strokeRect(menuX, jMenuY, menuW, jutsuList.length * 40 + 10);

            for (let i = 0; i < jutsuList.length; i++) {
                const j = jutsuList[i];
                const y = jMenuY + 8 + i * 40;
                const isSelected = i === this.selectedMenuIndex;
                const canAfford = this.selectedUnit.currentChakra >= j.chakraCost;

                if (isSelected) {
                    ctx.fillStyle = 'rgba(255, 153, 0, 0.2)';
                    ctx.fillRect(menuX + 4, y - 2, menuW - 8, 36);
                }

                // Jutsu name + type badge
                ctx.fillStyle = canAfford ? (isSelected ? '#fff' : '#ccc') : '#555';
                ctx.font = 'bold 13px "Segoe UI", sans-serif';
                ctx.textAlign = 'left';
                ctx.fillText(j.name, menuX + 12, y + 12);

                // Type badge
                const typeColors = { push: '#f90', pull: '#c4f', attack: '#f44', pierce: '#ff4', heal: '#4f4', buff: '#ff0' };
                ctx.fillStyle = typeColors[j.type] || '#888';
                ctx.font = 'bold 9px "Segoe UI", sans-serif';
                const badge = j.type.toUpperCase();
                const badgeW = ctx.measureText(badge).width + 8;
                ctx.fillRect(menuX + 12, y + 16, badgeW, 14);
                ctx.fillStyle = '#000';
                ctx.fillText(badge, menuX + 16, y + 26);

                // Description
                ctx.font = '10px "Segoe UI", sans-serif';
                ctx.fillStyle = canAfford ? '#999' : '#444';
                ctx.fillText(j.description, menuX + 12 + badgeW + 6, y + 26);

                // Cost
                ctx.fillStyle = canAfford ? '#48f' : '#335';
                ctx.font = 'bold 12px "Segoe UI", sans-serif';
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
            ctx.globalAlpha = Math.min(1, ft.life);
            ctx.fillStyle = '#000';
            ctx.font = `bold ${ft.size}px "Segoe UI", sans-serif`;
            ctx.textAlign = 'center';
            ctx.fillText(ft.text, ft.x + 1, ft.y + 1);
            ctx.fillStyle = ft.color;
            ctx.fillText(ft.text, ft.x, ft.y);
            ctx.globalAlpha = 1;
        }
    }

    renderTurnBanner(ctx) {
        const alpha = Math.min(1, this.turnBannerTimer * 2.5);
        ctx.fillStyle = `rgba(0,0,0,${alpha * 0.7})`;
        ctx.fillRect(0, CANVAS_HEIGHT / 2 - 25, CANVAS_WIDTH, 50);

        ctx.fillStyle = `rgba(255,255,255,${alpha})`;
        ctx.font = 'bold 24px "Segoe UI", sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(this.turnBanner, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 6);
    }

    renderEndScreen(ctx) {
        ctx.fillStyle = 'rgba(0,0,0,0.75)';
        ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

        const isVictory = this.phase === PHASE.VICTORY;

        // Big text
        ctx.fillStyle = isVictory ? '#f90' : '#c44';
        ctx.font = 'bold 48px "Segoe UI", sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(isVictory ? 'VICTORY!' : 'DEFEAT', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 30);

        if (isVictory) {
            // Territory control result
            const pct = Math.round((this.territoryLine / BATTLE_COLS) * 100);
            ctx.fillStyle = '#fff';
            ctx.font = '18px "Segoe UI", sans-serif';
            ctx.fillText(`Territory Secured: ${pct}%`, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 10);

            let totalXP = 0;
            for (const enemy of this.encounter.enemies) {
                totalXP += 15;
            }
            ctx.fillStyle = '#ff0';
            ctx.fillText(`+${totalXP} XP earned`, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 35);
        }

        ctx.fillStyle = '#888';
        ctx.font = '14px "Segoe UI", sans-serif';
        ctx.fillText('Press SPACE to continue', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 70);
    }
}
