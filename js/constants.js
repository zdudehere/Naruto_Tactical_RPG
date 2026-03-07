// Canvas and rendering
export const CANVAS_WIDTH = 800;
export const CANVAS_HEIGHT = 600;
export const TILE_SIZE = 32;
export const MAP_COLS = 25;
export const MAP_ROWS = 19;

// Game states
export const SCENE = {
    TITLE: 'title',
    OVERWORLD: 'overworld',
    BATTLE: 'battle',
    DIALOGUE: 'dialogue',
    SKILL_TREE: 'skill_tree'
};

// Directions
export const DIR = {
    UP: 'up',
    DOWN: 'down',
    LEFT: 'left',
    RIGHT: 'right'
};

// Tile types
export const TILE = {
    GRASS: 0,
    PATH: 1,
    WATER: 2,
    WALL: 3,
    BUILDING: 4,
    TREE: 5,
    DOOR: 6,
    BRIDGE: 7,
    FENCE: 8,
    FLOWER: 9
};

// Tile colors
export const TILE_COLORS = {
    [TILE.GRASS]: '#3a7d32',
    [TILE.PATH]: '#c4a862',
    [TILE.WATER]: '#2277bb',
    [TILE.WALL]: '#666666',
    [TILE.BUILDING]: '#8b6b4a',
    [TILE.TREE]: '#2d5a1e',
    [TILE.DOOR]: '#5a3a1a',
    [TILE.BRIDGE]: '#9a7a4a',
    [TILE.FENCE]: '#7a5a3a',
    [TILE.FLOWER]: '#3a7d32'
};

// Battle constants
export const BATTLE_COLS = 12;
export const BATTLE_ROWS = 8;
export const BATTLE_TILE_SIZE = 56;
export const BATTLE_OFFSET_X = 64;
export const BATTLE_OFFSET_Y = 76;

// Character colors
export const CHAR_COLORS = {
    naruto: {
        hair: '#f0c030',
        outfit: '#f07020',
        accent: '#2060c0',
        skin: '#f0c8a0',
        headband: '#3060c0'
    },
    sasuke: {
        hair: '#1a1a2e',
        outfit: '#2a2a4e',
        accent: '#e8e8f0',
        skin: '#f0d0b0',
        headband: '#3060c0'
    },
    sakura: {
        hair: '#f08090',
        outfit: '#cc2244',
        accent: '#f0d0d0',
        skin: '#f0d0b8',
        headband: '#cc2244'
    },
    kakashi: {
        hair: '#c0c0c8',
        outfit: '#2a3a2a',
        accent: '#404850',
        skin: '#d8c0a0',
        headband: '#3060c0'
    },
    enemy_ninja: {
        hair: '#4a4a4a',
        outfit: '#3a3a5a',
        accent: '#6a6a8a',
        skin: '#d8b890',
        headband: '#804020'
    },
    bandit: {
        hair: '#5a3a1a',
        outfit: '#5a5a3a',
        accent: '#8a7a5a',
        skin: '#d8b890',
        headband: '#5a3a1a'
    }
};

// Animation
export const ANIM_SPEED = 150; // ms per frame
export const MOVE_SPEED = 3; // pixels per frame in overworld
export const WALK_FRAMES = 4;
