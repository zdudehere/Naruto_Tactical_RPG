import { CANVAS_WIDTH, CANVAS_HEIGHT } from '../constants.js';
import { SKILL_TREES, canUnlockNode, unlockNode } from '../data/characters.js';

/**
 * Skill Tree Scene
 *
 * Visual tree layout — navigate nodes, spend SP.
 * Tab between party members with Q/E.
 * Arrow keys to move cursor between nodes.
 * Space/Enter to unlock a node.
 * Escape to return to overworld.
 */

// Layout constants
const NODE_RADIUS = 18;
const TIER_Y_START = 80;
const TIER_Y_GAP = 100;
const TREE_CENTER_X = CANVAS_WIDTH / 2;

// Colors
const COL = {
    bg: '#1a1a2e',
    locked: '#3a3a5a',
    available: '#4a6a2a',
    unlocked: '#2a8a4a',
    exclusive_locked: '#6a2a2a',
    cursor: '#f0c030',
    line: '#333',
    line_unlocked: '#4a8a4a',
    text: '#e0e0e0',
    dim: '#666',
    sp: '#f0c030',
    tier_label: '#444',
};

export class SkillTreeScene {
    constructor(game) {
        this.game = game;
        this.partyIndex = 0;
        this.cursorIndex = 0;
        this.flashTimer = 0;
        this.unlockMessage = null;
        this.unlockMessageTimer = 0;

        // Precompute node positions for current character
        this.nodePositions = [];
        this.computeLayout();
    }

    get character() {
        return this.game.party[this.partyIndex];
    }

    get tree() {
        return SKILL_TREES[this.character.templateId] || [];
    }

    computeLayout() {
        const tree = this.tree;
        if (!tree.length) { this.nodePositions = []; return; }

        // Group nodes by tier
        const tiers = {};
        for (const node of tree) {
            if (!tiers[node.tier]) tiers[node.tier] = [];
            tiers[node.tier].push(node);
        }

        this.nodePositions = [];
        for (const node of tree) {
            const tierNodes = tiers[node.tier];
            const idx = tierNodes.indexOf(node);
            const count = tierNodes.length;
            const spacing = Math.min(160, (CANVAS_WIDTH - 120) / count);
            const startX = TREE_CENTER_X - ((count - 1) * spacing) / 2;
            this.nodePositions.push({
                id: node.id,
                x: startX + idx * spacing,
                y: TIER_Y_START + (node.tier - 1) * TIER_Y_GAP,
            });
        }

        // Clamp cursor
        if (this.cursorIndex >= tree.length) this.cursorIndex = 0;
    }

    update(dt) {
        const input = this.game.input;
        this.flashTimer += dt;

        if (this.unlockMessageTimer > 0) {
            this.unlockMessageTimer -= dt;
            if (this.unlockMessageTimer <= 0) this.unlockMessage = null;
        }

        // Tab characters
        if (input.wasPressed('KeyQ') || input.wasPressed('BracketLeft')) {
            this.partyIndex = (this.partyIndex - 1 + this.game.party.length) % this.game.party.length;
            this.cursorIndex = 0;
            this.computeLayout();
        }
        if (input.wasPressed('KeyE') || input.wasPressed('BracketRight')) {
            this.partyIndex = (this.partyIndex + 1) % this.game.party.length;
            this.cursorIndex = 0;
            this.computeLayout();
        }

        // Navigate nodes
        if (input.wasPressed('ArrowUp') || input.wasPressed('KeyW')) {
            this.moveCursor(-1, 'vertical');
        }
        if (input.wasPressed('ArrowDown') || input.wasPressed('KeyS')) {
            this.moveCursor(1, 'vertical');
        }
        if (input.wasPressed('ArrowLeft') || input.wasPressed('KeyA')) {
            this.moveCursor(-1, 'horizontal');
        }
        if (input.wasPressed('ArrowRight') || input.wasPressed('KeyD')) {
            this.moveCursor(1, 'horizontal');
        }

        // Unlock node
        if (input.wasPressed('Space') || input.wasPressed('Enter')) {
            const node = this.tree[this.cursorIndex];
            if (node) {
                const result = unlockNode(this.character, node.id);
                if (result) {
                    this.unlockMessage = result;
                    this.unlockMessageTimer = 2.5;
                }
            }
        }

        // Mouse click on nodes
        if (input.mouseClicked) {
            const mx = input.mouseX;
            const my = input.mouseY;
            for (let i = 0; i < this.nodePositions.length; i++) {
                const pos = this.nodePositions[i];
                const dx = mx - pos.x;
                const dy = my - pos.y;
                if (dx * dx + dy * dy < NODE_RADIUS * NODE_RADIUS * 1.5) {
                    this.cursorIndex = i;
                    // Try unlock on click
                    const node = this.tree[i];
                    if (node && canUnlockNode(this.character, node.id)) {
                        const result = unlockNode(this.character, node.id);
                        if (result) {
                            this.unlockMessage = result;
                            this.unlockMessageTimer = 2.5;
                        }
                    }
                    break;
                }
            }
        }

        // Exit
        if (input.wasPressed('Escape') || input.wasPressed('Backspace')) {
            this.game.returnToOverworld();
        }
    }

    moveCursor(dir, axis) {
        const pos = this.nodePositions[this.cursorIndex];
        if (!pos) return;

        let best = -1;
        let bestDist = Infinity;

        for (let i = 0; i < this.nodePositions.length; i++) {
            if (i === this.cursorIndex) continue;
            const p = this.nodePositions[i];
            const dx = p.x - pos.x;
            const dy = p.y - pos.y;

            if (axis === 'vertical') {
                if (dir > 0 && dy <= 5) continue;
                if (dir < 0 && dy >= -5) continue;
                const dist = Math.abs(dy) + Math.abs(dx) * 0.3;
                if (dist < bestDist) { bestDist = dist; best = i; }
            } else {
                if (dir > 0 && dx <= 5) continue;
                if (dir < 0 && dx >= -5) continue;
                const dist = Math.abs(dx) + Math.abs(dy) * 0.3;
                if (dist < bestDist) { bestDist = dist; best = i; }
            }
        }

        if (best >= 0) this.cursorIndex = best;
    }

    render(ctx) {
        const tree = this.tree;
        const char = this.character;
        const unlocked = char.unlockedNodes || [];

        // Background
        ctx.fillStyle = COL.bg;
        ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

        // Title bar
        ctx.fillStyle = 'rgba(0,0,0,0.4)';
        ctx.fillRect(0, 0, CANVAS_WIDTH, 50);
        ctx.fillStyle = COL.text;
        ctx.font = 'bold 20px "Segoe UI", sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(`${char.name} — Skill Tree`, CANVAS_WIDTH / 2, 32);

        // SP display
        ctx.fillStyle = COL.sp;
        ctx.font = 'bold 16px "Segoe UI", sans-serif';
        ctx.textAlign = 'right';
        ctx.fillText(`SP: ${char.skillPoints || 0}`, CANVAS_WIDTH - 20, 32);

        // Level display
        ctx.fillStyle = COL.dim;
        ctx.font = '14px "Segoe UI", sans-serif';
        ctx.textAlign = 'left';
        ctx.fillText(`Lv ${char.level}   XP: ${char.xp}/${char.xpToNext}`, 20, 32);

        // Character tabs
        ctx.font = '12px "Segoe UI", sans-serif';
        ctx.textAlign = 'center';
        for (let i = 0; i < this.game.party.length; i++) {
            const p = this.game.party[i];
            const tx = 200 + i * 140;
            const hasSP = (p.skillPoints || 0) > 0;
            ctx.fillStyle = i === this.partyIndex ? '#fff' : COL.dim;
            const label = `[${i === this.partyIndex ? '>' : ' '}] ${p.name.split(' ')[0]}${hasSP ? ' *' : ''}`;
            ctx.fillText(label, tx, 62);
        }

        // Tier labels
        ctx.fillStyle = COL.tier_label;
        ctx.font = '10px "Segoe UI", sans-serif';
        ctx.textAlign = 'left';
        for (let t = 1; t <= 5; t++) {
            const y = TIER_Y_START + (t - 1) * TIER_Y_GAP;
            const label = t === 5 ? 'Capstone' : `Tier ${t}`;
            ctx.fillText(label, 10, y + 4);
        }

        // Draw connection lines
        for (let i = 0; i < tree.length; i++) {
            const node = tree[i];
            const pos = this.nodePositions[i];
            for (const reqId of node.requires) {
                const reqIdx = tree.findIndex(n => n.id === reqId);
                if (reqIdx < 0) continue;
                const reqPos = this.nodePositions[reqIdx];
                const bothUnlocked = unlocked.includes(node.id) && unlocked.includes(reqId);
                ctx.strokeStyle = bothUnlocked ? COL.line_unlocked : COL.line;
                ctx.lineWidth = bothUnlocked ? 2 : 1;
                ctx.beginPath();
                ctx.moveTo(reqPos.x, reqPos.y + NODE_RADIUS);
                ctx.lineTo(pos.x, pos.y - NODE_RADIUS);
                ctx.stroke();
            }
        }

        // Draw nodes
        for (let i = 0; i < tree.length; i++) {
            const node = tree[i];
            const pos = this.nodePositions[i];
            const isUnlocked = unlocked.includes(node.id);
            const isAvailable = canUnlockNode(char, node.id);
            const isCursor = i === this.cursorIndex;
            const isExclusiveLocked = !isUnlocked && node.exclusive &&
                tree.filter(n => n.exclusive === node.exclusive).some(n => unlocked.includes(n.id));

            // Node circle
            let fill = COL.locked;
            if (isUnlocked) fill = COL.unlocked;
            else if (isExclusiveLocked) fill = COL.exclusive_locked;
            else if (isAvailable) fill = COL.available;

            ctx.beginPath();
            ctx.arc(pos.x, pos.y, NODE_RADIUS, 0, Math.PI * 2);
            ctx.fillStyle = fill;
            ctx.fill();

            // Cursor ring
            if (isCursor) {
                const pulse = Math.sin(this.flashTimer * 4) * 0.3 + 0.7;
                ctx.strokeStyle = COL.cursor;
                ctx.lineWidth = 3;
                ctx.globalAlpha = pulse;
                ctx.beginPath();
                ctx.arc(pos.x, pos.y, NODE_RADIUS + 4, 0, Math.PI * 2);
                ctx.stroke();
                ctx.globalAlpha = 1;
            }

            // Unlocked check mark
            if (isUnlocked) {
                ctx.fillStyle = '#fff';
                ctx.font = 'bold 16px "Segoe UI", sans-serif';
                ctx.textAlign = 'center';
                ctx.fillText('✓', pos.x, pos.y + 6);
            }

            // Node name
            ctx.fillStyle = isUnlocked ? '#cfc' : isAvailable ? '#eee' : COL.dim;
            ctx.font = '11px "Segoe UI", sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText(node.name, pos.x, pos.y + NODE_RADIUS + 14);
        }

        // Selected node details panel
        const selectedNode = tree[this.cursorIndex];
        if (selectedNode) {
            this.renderNodeDetails(ctx, selectedNode, unlocked);
        }

        // Unlock feedback message
        if (this.unlockMessage) {
            ctx.fillStyle = 'rgba(0,0,0,0.7)';
            ctx.fillRect(CANVAS_WIDTH / 2 - 200, CANVAS_HEIGHT - 100, 400, 30);
            ctx.fillStyle = '#4f4';
            ctx.font = 'bold 14px "Segoe UI", sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText(`Unlocked! ${this.unlockMessage}`, CANVAS_WIDTH / 2, CANVAS_HEIGHT - 80);
        }

        // Controls hint
        ctx.fillStyle = 'rgba(0,0,0,0.5)';
        ctx.fillRect(0, CANVAS_HEIGHT - 28, CANVAS_WIDTH, 28);
        ctx.fillStyle = COL.dim;
        ctx.font = '11px "Segoe UI", sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('WASD/Arrows: Navigate    SPACE: Unlock    Q/E: Switch Character    ESC: Back', CANVAS_WIDTH / 2, CANVAS_HEIGHT - 10);
    }

    renderNodeDetails(ctx, node, unlocked) {
        const panelX = 20;
        const panelY = CANVAS_HEIGHT - 160;
        const panelW = CANVAS_WIDTH - 40;
        const panelH = 55;

        ctx.fillStyle = 'rgba(0,0,0,0.7)';
        ctx.fillRect(panelX, panelY, panelW, panelH);
        ctx.strokeStyle = '#555';
        ctx.lineWidth = 1;
        ctx.strokeRect(panelX, panelY, panelW, panelH);

        const isUnlocked = unlocked.includes(node.id);
        const isAvailable = canUnlockNode(this.character, node.id);

        // Node name and status
        ctx.fillStyle = isUnlocked ? '#4f4' : isAvailable ? COL.sp : COL.text;
        ctx.font = 'bold 14px "Segoe UI", sans-serif';
        ctx.textAlign = 'left';
        const status = isUnlocked ? ' [UNLOCKED]' : isAvailable ? ' [AVAILABLE — Press SPACE]' : '';
        ctx.fillText(node.name + status, panelX + 10, panelY + 20);

        // Description
        ctx.fillStyle = '#bbb';
        ctx.font = '12px "Segoe UI", sans-serif';
        ctx.fillText(node.description, panelX + 10, panelY + 40);

        // Prerequisites
        if (node.requires.length > 0 && !isUnlocked) {
            const tree = this.tree;
            const reqNames = node.requires.map(r => {
                const reqNode = tree.find(n => n.id === r);
                const met = unlocked.includes(r);
                return (met ? '✓' : '✗') + ' ' + (reqNode ? reqNode.name : r);
            }).join('   ');
            ctx.fillStyle = '#888';
            ctx.textAlign = 'right';
            ctx.fillText('Requires: ' + reqNames, panelX + panelW - 10, panelY + 20);
        }

        // Exclusive warning
        if (node.exclusive && !isUnlocked) {
            const tree = this.tree;
            const groupNodes = tree.filter(n => n.exclusive === node.exclusive && n.id !== node.id);
            const otherPicked = groupNodes.some(n => unlocked.includes(n.id));
            if (otherPicked) {
                ctx.fillStyle = '#c44';
                ctx.textAlign = 'right';
                ctx.fillText('LOCKED — Other capstone chosen', panelX + panelW - 10, panelY + 40);
            } else if (groupNodes.length > 0) {
                ctx.fillStyle = '#ca4';
                ctx.textAlign = 'right';
                ctx.fillText('Exclusive — choose only one capstone', panelX + panelW - 10, panelY + 40);
            }
        }
    }
}
