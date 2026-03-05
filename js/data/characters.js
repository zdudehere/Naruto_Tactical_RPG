/**
 * Character definitions for Team 7 and enemies.
 * Each character has base stats, jutsu, and growth rates.
 */
export const CHARACTER_TEMPLATES = {
    naruto: {
        name: 'Naruto Uzumaki',
        sprite: 'naruto',
        baseStats: {
            hp: 120,
            chakra: 80,
            attack: 14,
            defense: 10,
            speed: 12,
            range: 1,
            move: 4
        },
        growthRates: {
            hp: 15,
            chakra: 8,
            attack: 2,
            defense: 1,
            speed: 2
        },
        jutsu: [
            {
                name: 'Shadow Clone Jutsu',
                description: 'Creates shadow clones to attack. Hits all adjacent enemies.',
                chakraCost: 15,
                power: 18,
                range: 1,
                area: 'adjacent',
                type: 'physical',
                animation: 'clone'
            },
            {
                name: 'Rasengan',
                description: 'A powerful spiraling chakra sphere.',
                chakraCost: 30,
                power: 40,
                range: 1,
                area: 'single',
                type: 'chakra',
                animation: 'rasengan'
            },
            {
                name: 'Talk no Jutsu',
                description: 'Inspire an ally, boosting their attack for 3 turns.',
                chakraCost: 10,
                power: 0,
                range: 3,
                area: 'single',
                type: 'buff',
                effect: { stat: 'attack', bonus: 5, duration: 3 },
                animation: 'buff'
            }
        ]
    },
    sasuke: {
        name: 'Sasuke Uchiha',
        sprite: 'sasuke',
        baseStats: {
            hp: 100,
            chakra: 100,
            attack: 16,
            defense: 9,
            speed: 14,
            range: 1,
            move: 5
        },
        growthRates: {
            hp: 10,
            chakra: 12,
            attack: 3,
            defense: 1,
            speed: 2
        },
        jutsu: [
            {
                name: 'Fireball Jutsu',
                description: 'Launches a massive fireball at enemies in a line.',
                chakraCost: 20,
                power: 28,
                range: 3,
                area: 'line',
                type: 'chakra',
                animation: 'fireball'
            },
            {
                name: 'Chidori',
                description: 'Lightning-fast piercing attack with immense power.',
                chakraCost: 35,
                power: 45,
                range: 1,
                area: 'single',
                type: 'chakra',
                animation: 'chidori'
            },
            {
                name: 'Sharingan',
                description: 'Activate Sharingan to boost speed and evasion for 3 turns.',
                chakraCost: 15,
                power: 0,
                range: 0,
                area: 'self',
                type: 'buff',
                effect: { stat: 'speed', bonus: 8, duration: 3 },
                animation: 'sharingan'
            }
        ]
    },
    sakura: {
        name: 'Sakura Haruno',
        sprite: 'sakura',
        baseStats: {
            hp: 90,
            chakra: 120,
            attack: 18,
            defense: 8,
            speed: 10,
            range: 1,
            move: 3
        },
        growthRates: {
            hp: 8,
            chakra: 15,
            attack: 2,
            defense: 1,
            speed: 1
        },
        jutsu: [
            {
                name: 'Healing Jutsu',
                description: 'Restore HP to an ally.',
                chakraCost: 20,
                power: 35,
                range: 3,
                area: 'single',
                type: 'heal',
                animation: 'heal'
            },
            {
                name: 'Cherry Blossom Impact',
                description: 'Channel chakra into a devastating punch.',
                chakraCost: 25,
                power: 42,
                range: 1,
                area: 'single',
                type: 'physical',
                animation: 'impact'
            },
            {
                name: 'Chakra Boost',
                description: 'Boost an ally\'s defense for 3 turns.',
                chakraCost: 15,
                power: 0,
                range: 3,
                area: 'single',
                type: 'buff',
                effect: { stat: 'defense', bonus: 6, duration: 3 },
                animation: 'buff'
            }
        ]
    }
};

export const ENEMY_TEMPLATES = {
    bandit: {
        name: 'Bandit',
        sprite: 'bandit',
        baseStats: {
            hp: 60,
            chakra: 20,
            attack: 10,
            defense: 6,
            speed: 8,
            range: 1,
            move: 3
        },
        jutsu: [
            {
                name: 'Slash',
                description: 'A basic sword slash.',
                chakraCost: 0,
                power: 12,
                range: 1,
                area: 'single',
                type: 'physical',
                animation: 'slash'
            }
        ],
        xpReward: 20,
        ai: 'aggressive'
    },
    rogue_ninja: {
        name: 'Rogue Ninja',
        sprite: 'enemy_ninja',
        baseStats: {
            hp: 80,
            chakra: 50,
            attack: 13,
            defense: 8,
            speed: 11,
            range: 1,
            move: 4
        },
        jutsu: [
            {
                name: 'Shuriken Barrage',
                description: 'Throws a flurry of shuriken.',
                chakraCost: 10,
                power: 16,
                range: 3,
                area: 'single',
                type: 'physical',
                animation: 'shuriken'
            },
            {
                name: 'Water Clone',
                description: 'Creates a water clone to attack.',
                chakraCost: 15,
                power: 20,
                range: 1,
                area: 'single',
                type: 'chakra',
                animation: 'clone'
            }
        ],
        xpReward: 35,
        ai: 'tactical'
    },
    jonin: {
        name: 'Enemy Jonin',
        sprite: 'enemy_ninja',
        baseStats: {
            hp: 150,
            chakra: 100,
            attack: 20,
            defense: 14,
            speed: 15,
            range: 1,
            move: 5
        },
        jutsu: [
            {
                name: 'Earth Wall',
                description: 'Raises a wall, boosting own defense.',
                chakraCost: 20,
                power: 0,
                range: 0,
                area: 'self',
                type: 'buff',
                effect: { stat: 'defense', bonus: 8, duration: 2 },
                animation: 'buff'
            },
            {
                name: 'Lightning Strike',
                description: 'A powerful lightning attack.',
                chakraCost: 30,
                power: 35,
                range: 2,
                area: 'single',
                type: 'chakra',
                animation: 'chidori'
            }
        ],
        xpReward: 60,
        ai: 'tactical'
    }
};

/**
 * Create a new character instance from a template.
 */
export function createCharacter(templateId, level = 1) {
    const template = CHARACTER_TEMPLATES[templateId] || ENEMY_TEMPLATES[templateId];
    if (!template) return null;

    const stats = { ...template.baseStats };
    const growth = template.growthRates || { hp: 5, chakra: 5, attack: 1, defense: 1, speed: 1 };

    // Apply level-up bonuses
    for (let i = 1; i < level; i++) {
        stats.hp += growth.hp;
        stats.chakra += growth.chakra;
        stats.attack += growth.attack;
        stats.defense += growth.defense;
        stats.speed += growth.speed;
    }

    return {
        id: templateId + '_' + Date.now() + '_' + Math.random().toString(36).slice(2, 6),
        templateId,
        name: template.name,
        sprite: template.sprite,
        level,
        xp: 0,
        xpToNext: level * 50,
        stats,
        maxHp: stats.hp,
        maxChakra: stats.chakra,
        currentHp: stats.hp,
        currentChakra: stats.chakra,
        jutsu: template.jutsu.map(j => ({ ...j })),
        buffs: [],
        isAlly: !ENEMY_TEMPLATES[templateId],
        ai: template.ai || null,
        xpReward: template.xpReward || 0,
        // Battle position (set during battle)
        gridX: 0,
        gridY: 0,
        hasMoved: false,
        hasActed: false
    };
}

/**
 * Give XP to a character and handle level ups.
 */
export function grantXP(character, amount) {
    character.xp += amount;
    const messages = [];
    while (character.xp >= character.xpToNext) {
        character.xp -= character.xpToNext;
        character.level++;
        character.xpToNext = character.level * 50;

        const template = CHARACTER_TEMPLATES[character.templateId];
        if (template) {
            const g = template.growthRates;
            character.stats.hp += g.hp;
            character.stats.chakra += g.chakra;
            character.stats.attack += g.attack;
            character.stats.defense += g.defense;
            character.stats.speed += g.speed;
            character.maxHp = character.stats.hp;
            character.maxChakra = character.stats.chakra;
            character.currentHp = character.maxHp;
            character.currentChakra = character.maxChakra;
            messages.push(`${character.name} leveled up to ${character.level}!`);
        }
    }
    return messages;
}
