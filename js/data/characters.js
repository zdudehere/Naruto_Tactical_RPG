/**
 * Character definitions for Team 7 and enemies.
 * Into the Breach-inspired: low HP, high stakes, every point matters.
 *
 * TERRITORY BATTLE STATS:
 * - hp: 3-8 range. Every hit is dangerous.
 * - chakra: 3-6 range. Jutsu are precious resources.
 * - attack: 1-4 base damage.
 * - defense: 0-2, reduces incoming damage (min 1 after reduction).
 * - speed: Turn order priority + evasion modifier.
 * - evasion: Base % chance to dodge (0-25). Speed adds to this.
 * - move: Tiles you can move within your territory.
 * - push: How many columns an attack pushes the target.
 * - range: Attack reach in tiles (manhattan distance).
 */
export const CHARACTER_TEMPLATES = {
    naruto: {
        name: 'Naruto Uzumaki',
        sprite: 'naruto',
        baseStats: {
            hp: 6,
            chakra: 4,
            attack: 2,
            defense: 1,
            speed: 3,
            evasion: 10,
            move: 3,
            push: 1,
            range: 1
        },
        growthRates: {
            hp: 1,
            chakra: 1,
            attack: 1,
            defense: 0,
            speed: 1,
            evasion: 2
        },
        jutsu: [
            {
                name: 'Shadow Clone Barrage',
                description: 'Clones slam the enemy back. Push 2 columns.',
                chakraCost: 2,
                power: 1,
                push: 2,
                range: 1,
                type: 'push',
                animation: 'clone'
            },
            {
                name: 'Rasengan',
                description: 'Devastating spiral sphere. 3 damage + push 1.',
                chakraCost: 3,
                power: 3,
                push: 1,
                range: 1,
                type: 'attack',
                animation: 'rasengan'
            },
            {
                name: 'Talk no Jutsu',
                description: 'PULL an enemy into your territory. Triggers Attacks of Opportunity!',
                chakraCost: 2,
                power: 0,
                pull: true,
                range: 3,
                type: 'pull',
                animation: 'pull'
            }
        ]
    },
    sasuke: {
        name: 'Sasuke Uchiha',
        sprite: 'sasuke',
        baseStats: {
            hp: 5,
            chakra: 5,
            attack: 3,
            defense: 0,
            speed: 4,
            evasion: 20,
            move: 3,
            push: 1,
            range: 1
        },
        growthRates: {
            hp: 1,
            chakra: 1,
            attack: 1,
            defense: 0,
            speed: 1,
            evasion: 3
        },
        jutsu: [
            {
                name: 'Fireball Jutsu',
                description: 'Ranged fire blast. 2 damage + push 1. Range 3.',
                chakraCost: 2,
                power: 2,
                push: 1,
                range: 3,
                type: 'attack',
                animation: 'fireball'
            },
            {
                name: 'Chidori',
                description: 'Lightning pierce. 4 damage, ignores defense.',
                chakraCost: 4,
                power: 4,
                push: 0,
                range: 1,
                type: 'pierce',
                animation: 'chidori'
            },
            {
                name: 'Sharingan',
                description: 'Predict attacks. +30% evasion for 3 turns.',
                chakraCost: 2,
                power: 0,
                range: 0,
                type: 'buff',
                effect: { stat: 'evasion', bonus: 30, duration: 3 },
                animation: 'sharingan'
            }
        ]
    },
    sakura: {
        name: 'Sakura Haruno',
        sprite: 'sakura',
        baseStats: {
            hp: 4,
            chakra: 6,
            attack: 2,
            defense: 1,
            speed: 2,
            evasion: 5,
            move: 2,
            push: 2,
            range: 1
        },
        growthRates: {
            hp: 1,
            chakra: 1,
            attack: 1,
            defense: 1,
            speed: 0,
            evasion: 1
        },
        jutsu: [
            {
                name: 'Healing Jutsu',
                description: 'Restore 3 HP to an ally. Range 3.',
                chakraCost: 2,
                power: 3,
                range: 3,
                type: 'heal',
                animation: 'heal'
            },
            {
                name: 'Cherry Blossom Impact',
                description: 'Superhuman punch. 2 damage + push 3!',
                chakraCost: 3,
                power: 2,
                push: 3,
                range: 1,
                type: 'push',
                animation: 'impact'
            },
            {
                name: 'Chakra Shield',
                description: 'Grant ally +2 defense for 3 turns.',
                chakraCost: 2,
                power: 0,
                range: 3,
                type: 'buff',
                effect: { stat: 'defense', bonus: 2, duration: 3 },
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
            hp: 3,
            chakra: 1,
            attack: 1,
            defense: 0,
            speed: 2,
            evasion: 5,
            move: 2,
            push: 1,
            range: 1
        },
        jutsu: [
            {
                name: 'Shove',
                description: 'Push target 1 column.',
                chakraCost: 0,
                power: 1,
                push: 1,
                range: 1,
                type: 'push',
                animation: 'slash'
            }
        ],
        xpReward: 15,
        ai: 'aggressive'
    },
    rogue_ninja: {
        name: 'Rogue Ninja',
        sprite: 'enemy_ninja',
        baseStats: {
            hp: 4,
            chakra: 3,
            attack: 2,
            defense: 1,
            speed: 3,
            evasion: 15,
            move: 3,
            push: 1,
            range: 1
        },
        jutsu: [
            {
                name: 'Shuriken Volley',
                description: 'Ranged attack. 2 damage. Range 3.',
                chakraCost: 1,
                power: 2,
                push: 0,
                range: 3,
                type: 'attack',
                animation: 'shuriken'
            },
            {
                name: 'Body Flicker',
                description: 'PULL an ally into enemy territory!',
                chakraCost: 2,
                power: 0,
                pull: true,
                range: 2,
                type: 'pull',
                animation: 'clone'
            }
        ],
        xpReward: 25,
        ai: 'tactical'
    },
    jonin: {
        name: 'Enemy Jonin',
        sprite: 'enemy_ninja',
        baseStats: {
            hp: 8,
            chakra: 5,
            attack: 3,
            defense: 2,
            speed: 4,
            evasion: 20,
            move: 3,
            push: 2,
            range: 1
        },
        jutsu: [
            {
                name: 'Earth Wall',
                description: '+2 defense for 2 turns.',
                chakraCost: 2,
                power: 0,
                range: 0,
                type: 'buff',
                effect: { stat: 'defense', bonus: 2, duration: 2 },
                animation: 'buff'
            },
            {
                name: 'Lightning Spear',
                description: '3 damage + push 2. Range 2. Ignores defense.',
                chakraCost: 3,
                power: 3,
                push: 2,
                range: 2,
                type: 'pierce',
                animation: 'chidori'
            },
            {
                name: 'Summoning: Pull',
                description: 'PULL target into your territory!',
                chakraCost: 3,
                power: 0,
                pull: true,
                range: 3,
                type: 'pull',
                animation: 'pull'
            }
        ],
        xpReward: 50,
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
    const growth = template.growthRates || { hp: 1, chakra: 0, attack: 0, defense: 0, speed: 0, evasion: 1 };

    // Apply level-up bonuses
    for (let i = 1; i < level; i++) {
        stats.hp += growth.hp;
        stats.chakra += growth.chakra || 0;
        stats.attack += growth.attack;
        stats.defense += growth.defense;
        stats.speed += growth.speed;
        stats.evasion += growth.evasion || 0;
    }

    return {
        id: templateId + '_' + Date.now() + '_' + Math.random().toString(36).slice(2, 6),
        templateId,
        name: template.name,
        sprite: template.sprite,
        level,
        xp: 0,
        xpToNext: level * 30,
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
        // Battle position
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
        character.xpToNext = character.level * 30;

        const template = CHARACTER_TEMPLATES[character.templateId];
        if (template) {
            const g = template.growthRates;
            character.stats.hp += g.hp;
            character.stats.chakra += g.chakra || 0;
            character.stats.attack += g.attack;
            character.stats.defense += g.defense;
            character.stats.speed += g.speed;
            character.stats.evasion += g.evasion || 0;
            character.maxHp = character.stats.hp;
            character.maxChakra = character.stats.chakra;
            character.currentHp = character.maxHp;
            character.currentChakra = character.maxChakra;
            messages.push(`${character.name} leveled up to ${character.level}!`);
        }
    }
    return messages;
}

/**
 * Roll evasion check. Returns true if the attack is evaded.
 */
export function rollEvasion(attacker, defender) {
    const evasionChance = Math.min(75, defender.stats.evasion + Math.floor(defender.stats.speed * 2));
    const roll = Math.random() * 100;
    return roll < evasionChance;
}

/**
 * Calculate damage. Returns final damage (min 1 unless evaded).
 */
export function calculateDamage(attacker, defender, power, type) {
    let damage = power > 0 ? power : attacker.stats.attack;
    if (type !== 'pierce') {
        damage = Math.max(1, damage - defender.stats.defense);
    }
    return damage;
}
