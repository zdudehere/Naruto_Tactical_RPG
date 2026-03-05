import { TILE, MAP_COLS, MAP_ROWS } from '../constants.js';

const T = TILE;

/**
 * Konoha Village map - 25x19 tiles
 * Legend: 0=grass, 1=path, 2=water, 3=wall, 4=building, 5=tree, 6=door, 7=bridge, 8=fence, 9=flower
 */
export const MAPS = {
    konoha: {
        name: 'Hidden Leaf Village',
        width: MAP_COLS,
        height: MAP_ROWS,
        tiles: [
            [5,5,5,5,5,5,5,5,3,3,3,3,3,3,3,3,3,5,5,5,5,5,5,5,5],
            [5,5,0,0,0,5,5,0,3,4,4,4,4,4,4,4,3,0,5,5,0,0,0,5,5],
            [5,0,0,9,0,0,0,0,3,4,4,4,4,4,4,4,3,0,0,0,0,9,0,0,5],
            [5,0,9,0,0,0,0,1,3,3,3,3,6,3,3,3,3,1,0,0,0,0,9,0,5],
            [5,0,0,0,8,8,8,1,0,0,0,0,1,0,0,0,0,1,8,8,8,0,0,0,5],
            [5,0,0,0,8,0,0,1,0,0,0,0,1,0,0,0,0,1,0,0,8,0,0,0,5],
            [0,0,0,0,8,0,0,1,1,1,1,1,1,1,1,1,1,1,0,0,8,0,0,0,0],
            [0,0,5,0,0,0,0,1,0,0,3,3,3,3,3,0,0,1,0,0,0,0,5,0,0],
            [0,0,5,0,0,0,0,1,0,0,3,4,4,4,3,0,0,1,0,0,0,0,5,0,0],
            [1,1,1,1,1,1,1,1,0,0,3,4,4,4,3,0,0,1,1,1,1,1,1,1,1],
            [0,0,5,0,0,0,0,1,0,0,3,3,6,3,3,0,0,1,0,0,0,0,5,0,0],
            [0,0,5,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,5,0,0],
            [0,0,0,0,8,0,0,1,1,1,1,1,1,1,1,1,1,1,0,0,8,0,0,0,0],
            [5,0,0,0,8,0,0,1,0,0,0,0,0,0,0,0,0,1,0,0,8,0,0,0,5],
            [5,0,0,0,8,8,8,1,0,0,0,0,0,0,0,0,0,1,8,8,8,0,0,0,5],
            [5,0,9,0,0,0,0,1,0,0,0,0,0,0,0,0,0,1,0,0,0,0,9,0,5],
            [5,0,0,9,0,0,0,0,0,2,2,2,7,2,2,2,0,0,0,0,0,9,0,0,5],
            [5,5,0,0,0,0,5,0,0,2,2,2,7,2,2,2,0,0,5,0,0,0,0,5,5],
            [5,5,5,5,5,5,5,5,2,2,2,2,2,2,2,2,2,5,5,5,5,5,5,5,5],
        ],
        // NPCs on the map
        npcs: [
            {
                id: 'kakashi',
                name: 'Kakashi Sensei',
                sprite: 'kakashi',
                x: 12, y: 5,
                direction: 'down',
                dialogue: 'kakashi_intro'
            },
            {
                id: 'villager1',
                name: 'Villager',
                sprite: 'bandit',
                x: 3, y: 8,
                direction: 'right',
                dialogue: 'villager_hint'
            },
            {
                id: 'gate_guard',
                name: 'Gate Guard',
                sprite: 'enemy_ninja',
                x: 0, y: 9,
                direction: 'right',
                dialogue: 'gate_guard_intro'
            }
        ],
        // Player start position
        playerStart: { x: 12, y: 9 },
        // Trigger zones (events when player walks on tile)
        triggers: [
            {
                x: 12, y: 3, // Hokage building door
                type: 'dialogue',
                dialogueId: 'hokage_building'
            },
            {
                x: 12, y: 10, // Ramen shop door
                type: 'dialogue',
                dialogueId: 'ramen_shop'
            },
            {
                x: 0, y: 9, // Village gate - triggers battle
                type: 'story_check',
                storyFlag: 'talked_to_kakashi',
                dialogueId: 'gate_not_ready',
                elseDialogueId: 'gate_battle'
            }
        ],
        // Solid tiles (cannot walk on)
        solidTiles: [T.WALL, T.BUILDING, T.WATER, T.TREE, T.FENCE]
    },

    training_grounds: {
        name: 'Training Grounds',
        width: MAP_COLS,
        height: MAP_ROWS,
        tiles: [
            [5,5,5,5,5,5,5,5,5,5,5,5,5,5,5,5,5,5,5,5,5,5,5,5,5],
            [5,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,5],
            [5,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,5],
            [5,0,0,0,0,0,5,0,0,0,0,0,0,0,0,0,5,0,0,0,0,0,0,0,5],
            [5,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,5],
            [5,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,5],
            [5,0,0,5,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,5,0,0,0,5],
            [5,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,5],
            [5,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,5],
            [1,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,5],
            [5,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,5],
            [5,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,5],
            [5,0,0,5,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,5,0,0,0,5],
            [5,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,5],
            [5,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,5],
            [5,0,0,0,0,0,5,0,0,0,0,0,0,0,0,0,5,0,0,0,0,0,0,0,5],
            [5,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,5],
            [5,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,5],
            [5,5,5,5,5,5,5,5,5,5,5,5,5,5,5,5,5,5,5,5,5,5,5,5,5],
        ],
        npcs: [],
        playerStart: { x: 1, y: 9 },
        triggers: [],
        solidTiles: [T.WALL, T.BUILDING, T.WATER, T.TREE, T.FENCE]
    }
};

/**
 * Check if a tile position is solid (blocked) on the given map.
 */
export function isSolid(mapId, x, y) {
    const map = MAPS[mapId];
    if (!map) return true;
    if (x < 0 || y < 0 || x >= map.width || y >= map.height) return true;
    return map.solidTiles.includes(map.tiles[y][x]);
}

/**
 * Get NPC at the given position.
 */
export function getNPCAt(mapId, x, y) {
    const map = MAPS[mapId];
    if (!map) return null;
    return map.npcs.find(n => n.x === x && n.y === y) || null;
}

/**
 * Get trigger at the given position.
 */
export function getTriggerAt(mapId, x, y) {
    const map = MAPS[mapId];
    if (!map) return null;
    return map.triggers.find(t => t.x === x && t.y === y) || null;
}
