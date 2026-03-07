import { CANVAS_WIDTH, CANVAS_HEIGHT, SCENE } from './constants.js';
import { Input } from './input.js';
import { TitleScene } from './scenes/titleScene.js';
import { OverworldScene } from './scenes/overworldScene.js';
import { BattleScene } from './scenes/battleScene.js';
import { SkillTreeScene } from './scenes/skillTreeScene.js';
import { createCharacter } from './data/characters.js';
import { ENEMY_TEMPLATES } from './data/characters.js';
import { DIALOGUES } from './data/story.js';

class Game {
    constructor() {
        this.canvas = document.getElementById('game-canvas');
        this.canvas.width = CANVAS_WIDTH;
        this.canvas.height = CANVAS_HEIGHT;
        this.ctx = this.canvas.getContext('2d');
        this.ctx.imageSmoothingEnabled = false;

        this.input = new Input();

        // Game state
        this.currentScene = null;
        this.scene = SCENE.TITLE;
        this.party = [];
        this.storyFlags = {};
        this.overworldScene = null;

        // Dialogue state
        this.dialogueActive = false;
        this.currentDialogue = null;
        this.dialogueIndex = 0;
        this.dialogueCharIndex = 0;
        this.dialogueTimer = 0;
        this.dialogueSpeed = 0.03; // seconds per character
        this.dialogueCallback = null;

        // UI elements
        this.dialogueBox = document.getElementById('dialogue-box');
        this.dialogueSpeaker = document.getElementById('dialogue-speaker');
        this.dialogueText = document.getElementById('dialogue-text');
        this.uiOverlay = document.getElementById('ui-overlay');

        // Start with title screen
        this.currentScene = new TitleScene(this);
        this.uiOverlay.classList.remove('hidden');

        // Game loop
        this.lastTime = performance.now();
        this.gameLoop = this.gameLoop.bind(this);
        requestAnimationFrame(this.gameLoop);
    }

    gameLoop(timestamp) {
        const dt = Math.min((timestamp - this.lastTime) / 1000, 0.05); // Cap delta time
        this.lastTime = timestamp;

        // Update
        if (this.dialogueActive) {
            this.updateDialogue(dt);
        } else if (this.currentScene) {
            this.currentScene.update(dt);
        }

        // Render
        this.ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
        if (this.currentScene) {
            this.currentScene.render(this.ctx);
        }

        // End frame
        this.input.endFrame();

        requestAnimationFrame(this.gameLoop);
    }

    startNewGame() {
        // Create party
        this.party = [
            createCharacter('naruto', 1),
            createCharacter('sasuke', 1),
            createCharacter('sakura', 1)
        ];
        this.storyFlags = {};

        // Switch to overworld
        this.overworldScene = new OverworldScene(this);
        this.currentScene = this.overworldScene;
        this.scene = SCENE.OVERWORLD;
    }

    saveGame() {
        const saveData = {
            party: this.party,
            storyFlags: this.storyFlags,
            mapId: this.overworldScene?.mapId,
            playerX: this.overworldScene?.playerX,
            playerY: this.overworldScene?.playerY
        };
        try {
            localStorage.setItem('naruto_rpg_save', JSON.stringify(saveData));
            return true;
        } catch {
            return false;
        }
    }

    loadGame() {
        try {
            const data = JSON.parse(localStorage.getItem('naruto_rpg_save'));
            if (!data || !data.party) return false;

            this.party = data.party;
            this.storyFlags = data.storyFlags || {};
            this.overworldScene = new OverworldScene(this);
            if (data.mapId) {
                this.overworldScene.setMap(data.mapId,
                    Math.round(data.playerX / 32),
                    Math.round(data.playerY / 32));
            }
            this.currentScene = this.overworldScene;
            this.scene = SCENE.OVERWORLD;
            return true;
        } catch {
            return false;
        }
    }

    startDialogue(dialogueId) {
        const dialogue = DIALOGUES[dialogueId];
        if (!dialogue) return;

        this.dialogueActive = true;
        this.currentDialogue = dialogue;
        this.dialogueIndex = 0;
        this.dialogueCharIndex = 0;
        this.dialogueTimer = 0;

        this.dialogueBox.classList.remove('hidden');
        this.showCurrentDialogueLine();
    }

    showCurrentDialogueLine() {
        const line = this.currentDialogue.lines[this.dialogueIndex];
        if (!line) return;

        this.dialogueSpeaker.textContent = line.speaker || '';
        this.dialogueText.textContent = '';
        this.dialogueCharIndex = 0;
        this.dialogueTimer = 0;
    }

    updateDialogue(dt) {
        const line = this.currentDialogue.lines[this.dialogueIndex];
        if (!line) return;

        // Typewriter effect
        if (this.dialogueCharIndex < line.text.length) {
            this.dialogueTimer += dt;
            while (this.dialogueTimer >= this.dialogueSpeed && this.dialogueCharIndex < line.text.length) {
                this.dialogueTimer -= this.dialogueSpeed;
                this.dialogueCharIndex++;
                this.dialogueText.textContent = line.text.substring(0, this.dialogueCharIndex);
            }

            // Skip ahead on input
            if (this.input.wasPressed('Space') || this.input.wasPressed('Enter')) {
                this.dialogueCharIndex = line.text.length;
                this.dialogueText.textContent = line.text;
            }
        } else {
            // Wait for input to advance
            if (this.input.wasPressed('Space') || this.input.wasPressed('Enter')) {
                this.dialogueIndex++;
                if (this.dialogueIndex >= this.currentDialogue.lines.length) {
                    this.endDialogue();
                } else {
                    this.showCurrentDialogueLine();
                }
            }
        }
    }

    endDialogue() {
        this.dialogueActive = false;
        this.dialogueBox.classList.add('hidden');

        // Handle dialogue completion actions
        const action = this.currentDialogue.onComplete;
        if (action) {
            switch (action.action) {
                case 'setFlag':
                    this.storyFlags[action.flag] = true;
                    this.saveGame();
                    // Check for progression triggers
                    this.checkStoryProgression();
                    break;
                case 'heal':
                    for (const member of this.party) {
                        member.currentHp = member.maxHp;
                        member.currentChakra = member.maxChakra;
                    }
                    break;
                case 'startBattle':
                    this.startBattle(action.encounter);
                    break;
            }
        }

        this.currentDialogue = null;
    }

    checkStoryProgression() {
        // After completing first battle, set up second battle trigger
        if (this.storyFlags.completed_first_battle && !this.storyFlags.second_battle_available) {
            this.storyFlags.second_battle_available = true;
            // Update gate guard dialogue and trigger
            const map = this.overworldScene.map;
            const gateTrigger = map.triggers.find(t => t.x === 0 && t.y === 9);
            if (gateTrigger) {
                gateTrigger.storyFlag = 'completed_first_battle';
                gateTrigger.elseDialogueId = 'gate_battle_2';
            }

            // Add second battle dialogue
            DIALOGUES.gate_battle_2 = {
                lines: [
                    { speaker: 'Gate Guard', text: "Team 7! More rogue ninja have appeared - and they've brought a Jonin!" },
                    { speaker: 'Naruto', text: "A Jonin?! This is gonna be tough..." },
                    { speaker: 'Sasuke', text: "Good. I need a real challenge." },
                    { speaker: 'Sakura', text: "Stay together and we'll be fine!" }
                ],
                onComplete: {
                    action: 'startBattle',
                    encounter: 'second_battle'
                }
            };
        }

        if (this.storyFlags.completed_second_battle && !this.storyFlags.game_completed) {
            this.storyFlags.game_completed = true;
            setTimeout(() => this.startDialogue('game_complete'), 500);
        }
    }

    startBattle(encounterId) {
        this.scene = SCENE.BATTLE;
        this.currentScene = new BattleScene(this, encounterId);
    }

    openSkillTree() {
        this.scene = SCENE.SKILL_TREE;
        this.currentScene = new SkillTreeScene(this);
    }

    returnToOverworld() {
        this.scene = SCENE.OVERWORLD;
        this.currentScene = this.overworldScene;
        this.saveGame();
    }

    getEnemyTemplate(templateId) {
        return ENEMY_TEMPLATES[templateId] || null;
    }
}

// Start the game when the page loads
window.addEventListener('load', () => {
    new Game();
});
