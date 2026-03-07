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
 * SKILL TREES
 *
 * Each character has a tree of ~16 nodes across 5 tiers.
 * Node types:
 *   'stat'          — small stat boost (+1 HP, +1 Attack, etc.)
 *   'jutsu_upgrade' — improve an existing jutsu property
 *   'jutsu'         — unlock a brand new jutsu
 *   'passive'       — permanent triggered/aura ability
 *
 * Nodes with `exclusive` share a group — only one per group can be unlocked.
 * `requires` lists prerequisite node IDs.
 */
export const SKILL_TREES = {
    naruto: [
        // ── Tier 1 (no prereqs) ──
        { id: 'n1', name: '+1 HP', tier: 1, type: 'stat', effect: { stat: 'hp', value: 1 }, requires: [],
          description: 'Uzumaki stamina. Max HP +1.' },
        { id: 'n2', name: '+1 Chakra', tier: 1, type: 'stat', effect: { stat: 'chakra', value: 1 }, requires: [],
          description: 'Deeper reserves. Max Chakra +1.' },
        { id: 'n3', name: '+1 Speed', tier: 1, type: 'stat', effect: { stat: 'speed', value: 1 }, requires: [],
          description: 'Quicker on your feet. Speed +1.' },

        // ── Tier 2 ──
        { id: 'n4', name: 'Clone Force', tier: 2, type: 'jutsu_upgrade',
          effect: { jutsu: 'Shadow Clone Barrage', property: 'push', value: 3 },
          requires: ['n1'], description: 'Shadow Clone Barrage push 2 → 3.' },
        { id: 'n5', name: '+1 Attack', tier: 2, type: 'stat', effect: { stat: 'attack', value: 1 },
          requires: ['n3'], description: 'Harder hits. Attack +1.' },
        { id: 'n6', name: '+5 Evasion', tier: 2, type: 'stat', effect: { stat: 'evasion', value: 5 },
          requires: ['n3'], description: 'Unpredictable movement. Evasion +5.' },
        { id: 'n7', name: 'Rasengan Mastery', tier: 2, type: 'jutsu_upgrade',
          effect: { jutsu: 'Rasengan', property: 'chakraCost', value: 2 },
          requires: ['n2'], description: 'Rasengan chakra cost 3 → 2.' },

        // ── Tier 3 ──
        { id: 'n8', name: '+1 Move', tier: 3, type: 'stat', effect: { stat: 'move', value: 1 },
          requires: ['n5'], description: 'Extended range of motion. Move +1.' },
        { id: 'n9', name: '+1 HP', tier: 3, type: 'stat', effect: { stat: 'hp', value: 1 },
          requires: ['n4'], description: 'Tougher body. Max HP +1.' },
        { id: 'n10', name: 'Mass Shadow Clones', tier: 3, type: 'jutsu',
          effect: { jutsu: {
              name: 'Mass Shadow Clones', description: 'Clones hit all adjacent enemies. 1 dmg + push 1.',
              chakraCost: 3, power: 1, push: 1, range: 1, type: 'push', animation: 'clone', aoe: true
          }},
          requires: ['n4'], description: 'New jutsu: hit all adjacent enemies.' },
        { id: 'n11', name: '+1 Chakra', tier: 3, type: 'stat', effect: { stat: 'chakra', value: 1 },
          requires: ['n7'], description: 'Growing reserves. Max Chakra +1.' },

        // ── Tier 4 ──
        { id: 'n12', name: '+1 Attack', tier: 4, type: 'stat', effect: { stat: 'attack', value: 1 },
          requires: ['n8'], description: 'Refined taijutsu. Attack +1.' },
        { id: 'n13', name: '+1 Defense', tier: 4, type: 'stat', effect: { stat: 'defense', value: 1 },
          requires: ['n9'], description: 'Battle-hardened. Defense +1.' },
        { id: 'n14', name: 'Chakra Regen', tier: 4, type: 'passive',
          effect: { passive: 'chakra_regen', value: 1 },
          requires: ['n11'], description: 'Passive: Recover 1 chakra per turn.' },

        // ── Tier 5 (capstones — mutually exclusive) ──
        { id: 'n15', name: 'Sage Mode', tier: 5, type: 'jutsu', exclusive: 'naruto_capstone',
          effect: { jutsu: {
              name: 'Sage Mode', description: 'Nature energy. +2 attack, +2 defense for 3 turns.',
              chakraCost: 4, power: 0, range: 0, type: 'buff',
              effect: { stat: 'attack', bonus: 2, duration: 3 }, animation: 'rasengan'
          }},
          requires: ['n13', 'n14'], description: 'Sage Mode: balanced power boost.' },
        { id: 'n16', name: 'Nine-Tails Cloak', tier: 5, type: 'jutsu', exclusive: 'naruto_capstone',
          effect: { jutsu: {
              name: 'Nine-Tails Cloak', description: 'Kyuubi power! +3 attack for 3 turns.',
              chakraCost: 3, power: 0, range: 0, type: 'buff',
              effect: { stat: 'attack', bonus: 3, duration: 3 }, animation: 'clone'
          }},
          requires: ['n12'], description: 'Nine-Tails Cloak: raw offensive power.' },
    ],

    sasuke: [
        // ── Tier 1 ──
        { id: 's1', name: '+1 Speed', tier: 1, type: 'stat', effect: { stat: 'speed', value: 1 }, requires: [],
          description: 'Lightning reflexes. Speed +1.' },
        { id: 's2', name: '+1 Chakra', tier: 1, type: 'stat', effect: { stat: 'chakra', value: 1 }, requires: [],
          description: 'Uchiha focus. Max Chakra +1.' },
        { id: 's3', name: '+1 Attack', tier: 1, type: 'stat', effect: { stat: 'attack', value: 1 }, requires: [],
          description: 'Sharper strikes. Attack +1.' },

        // ── Tier 2 ──
        { id: 's4', name: 'Fireball Range', tier: 2, type: 'jutsu_upgrade',
          effect: { jutsu: 'Fireball Jutsu', property: 'range', value: 4 },
          requires: ['s3'], description: 'Fireball Jutsu range 3 → 4.' },
        { id: 's5', name: '+5 Evasion', tier: 2, type: 'stat', effect: { stat: 'evasion', value: 5 },
          requires: ['s1'], description: 'Hard to pin down. Evasion +5.' },
        { id: 's6', name: 'Sharingan+', tier: 2, type: 'jutsu_upgrade',
          effect: { jutsu: 'Sharingan', property: 'effect', value: { stat: 'evasion', bonus: 30, duration: 5 } },
          requires: ['s1'], description: 'Sharingan duration 3 → 5 turns.' },
        { id: 's7', name: '+1 HP', tier: 2, type: 'stat', effect: { stat: 'hp', value: 1 },
          requires: ['s2'], description: 'Endurance training. Max HP +1.' },

        // ── Tier 3 ──
        { id: 's8', name: '+1 Attack', tier: 3, type: 'stat', effect: { stat: 'attack', value: 1 },
          requires: ['s4'], description: 'Lethal precision. Attack +1.' },
        { id: 's9', name: 'Chidori Power', tier: 3, type: 'jutsu_upgrade',
          effect: { jutsu: 'Chidori', property: 'power', value: 5 },
          requires: ['s3', 's7'], description: 'Chidori damage 4 → 5.' },
        { id: 's10', name: 'Counter-Eye', tier: 3, type: 'passive',
          effect: { passive: 'counter_on_evade', value: 15 },
          requires: ['s6'], description: 'Passive: 15% chance to counter when dodging.' },
        { id: 's11', name: '+1 Range', tier: 3, type: 'stat', effect: { stat: 'range', value: 1 },
          requires: ['s5'], description: 'Extended reach. Attack range +1.' },

        // ── Tier 4 ──
        { id: 's12', name: '+1 Speed', tier: 4, type: 'stat', effect: { stat: 'speed', value: 1 },
          requires: ['s8'], description: 'Blinding speed. Speed +1.' },
        { id: 's13', name: '+1 Defense', tier: 4, type: 'stat', effect: { stat: 'defense', value: 1 },
          requires: ['s10'], description: 'Sharingan foresight. Defense +1.' },
        { id: 's14', name: '+1 Chakra', tier: 4, type: 'stat', effect: { stat: 'chakra', value: 1 },
          requires: ['s9'], description: 'Deeper reserves. Max Chakra +1.' },

        // ── Tier 5 (capstones) ──
        { id: 's15', name: 'Curse Mark', tier: 5, type: 'jutsu', exclusive: 'sasuke_capstone',
          effect: { jutsu: {
              name: 'Curse Mark', description: 'Dark power. +3 attack, +1 move for 2 turns.',
              chakraCost: 3, power: 0, range: 0, type: 'buff',
              effect: { stat: 'attack', bonus: 3, duration: 2 }, animation: 'chidori'
          }},
          requires: ['s12'], description: 'Curse Mark: explosive short burst.' },
        { id: 's16', name: 'Amaterasu', tier: 5, type: 'jutsu', exclusive: 'sasuke_capstone',
          effect: { jutsu: {
              name: 'Amaterasu', description: 'Black flames. 5 pierce damage. Range 4.',
              chakraCost: 5, power: 5, push: 0, range: 4, type: 'pierce', animation: 'fireball'
          }},
          requires: ['s13', 's14'], description: 'Amaterasu: devastating ranged pierce.' },
    ],

    sakura: [
        // ── Tier 1 ──
        { id: 'k1', name: '+1 Chakra', tier: 1, type: 'stat', effect: { stat: 'chakra', value: 1 }, requires: [],
          description: 'Precise control. Max Chakra +1.' },
        { id: 'k2', name: '+1 Defense', tier: 1, type: 'stat', effect: { stat: 'defense', value: 1 }, requires: [],
          description: 'Inner strength. Defense +1.' },
        { id: 'k3', name: '+1 HP', tier: 1, type: 'stat', effect: { stat: 'hp', value: 1 }, requires: [],
          description: 'Medical resilience. Max HP +1.' },

        // ── Tier 2 ──
        { id: 'k4', name: 'Healing Power', tier: 2, type: 'jutsu_upgrade',
          effect: { jutsu: 'Healing Jutsu', property: 'power', value: 4 },
          requires: ['k1'], description: 'Healing Jutsu restores 3 → 4 HP.' },
        { id: 'k5', name: '+1 Attack', tier: 2, type: 'stat', effect: { stat: 'attack', value: 1 },
          requires: ['k3'], description: 'Chakra-enhanced fists. Attack +1.' },
        { id: 'k6', name: 'Shield Duration', tier: 2, type: 'jutsu_upgrade',
          effect: { jutsu: 'Chakra Shield', property: 'effect', value: { stat: 'defense', bonus: 2, duration: 5 } },
          requires: ['k2'], description: 'Chakra Shield duration 3 → 5 turns.' },
        { id: 'k7', name: '+5 Evasion', tier: 2, type: 'stat', effect: { stat: 'evasion', value: 5 },
          requires: ['k2'], description: 'Light on her feet. Evasion +5.' },

        // ── Tier 3 ──
        { id: 'k8', name: '+1 Chakra', tier: 3, type: 'stat', effect: { stat: 'chakra', value: 1 },
          requires: ['k4'], description: 'Expanded reserves. Max Chakra +1.' },
        { id: 'k9', name: 'Impact Force', tier: 3, type: 'jutsu_upgrade',
          effect: { jutsu: 'Cherry Blossom Impact', property: 'push', value: 4 },
          requires: ['k5'], description: 'Cherry Blossom Impact push 3 → 4.' },
        { id: 'k10', name: '+1 Move', tier: 3, type: 'stat', effect: { stat: 'move', value: 1 },
          requires: ['k7'], description: 'Swift positioning. Move +1.' },
        { id: 'k11', name: 'Healing Range', tier: 3, type: 'jutsu_upgrade',
          effect: { jutsu: 'Healing Jutsu', property: 'range', value: 4 },
          requires: ['k4'], description: 'Healing Jutsu range 3 → 4.' },

        // ── Tier 4 ──
        { id: 'k12', name: '+1 Defense', tier: 4, type: 'stat', effect: { stat: 'defense', value: 1 },
          requires: ['k6', 'k8'], description: 'Iron will. Defense +1.' },
        { id: 'k13', name: '+1 Attack', tier: 4, type: 'stat', effect: { stat: 'attack', value: 1 },
          requires: ['k9'], description: 'Monster strength. Attack +1.' },
        { id: 'k14', name: 'Chakra Regen', tier: 4, type: 'passive',
          effect: { passive: 'chakra_regen', value: 1 },
          requires: ['k8'], description: 'Passive: Recover 1 chakra per turn.' },

        // ── Tier 5 (capstones) ──
        { id: 'k15', name: 'Mitotic Regen', tier: 5, type: 'passive', exclusive: 'sakura_capstone',
          effect: { passive: 'hp_regen', value: 1 },
          requires: ['k12'], description: 'Passive: Regenerate 1 HP per turn.' },
        { id: 'k16', name: 'Hundred Healings', tier: 5, type: 'jutsu', exclusive: 'sakura_capstone',
          effect: { jutsu: {
              name: 'Hundred Healings', description: 'Heal all allies for 2 HP.',
              chakraCost: 4, power: 2, range: 99, type: 'heal_all', animation: 'heal'
          }},
          requires: ['k14'], description: 'New jutsu: heal entire team.' },
    ],
};

/**
 * Create a new character instance from a template.
 */
export function createCharacter(templateId, level = 1) {
    const template = CHARACTER_TEMPLATES[templateId] || ENEMY_TEMPLATES[templateId];
    if (!template) return null;

    const stats = { ...template.baseStats };
    const isAlly = !ENEMY_TEMPLATES[templateId];

    // Enemies still use growth rates (no skill tree)
    if (!isAlly) {
        const growth = template.growthRates || { hp: 1, chakra: 0, attack: 0, defense: 0, speed: 0, evasion: 1 };
        for (let i = 1; i < level; i++) {
            stats.hp += growth.hp;
            stats.chakra += growth.chakra || 0;
            stats.attack += growth.attack;
            stats.defense += growth.defense;
            stats.speed += growth.speed;
            stats.evasion += growth.evasion || 0;
        }
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
        passives: [],
        isAlly,
        ai: template.ai || null,
        xpReward: template.xpReward || 0,
        // Skill tree state (allies only)
        skillPoints: 0,
        unlockedNodes: [],
        // Battle position
        gridX: 0,
        gridY: 0,
        hasMoved: false,
        hasActed: false
    };
}

/**
 * Give XP to a character and handle level ups.
 * Allies earn Skill Points instead of auto-stat growth.
 */
export function grantXP(character, amount) {
    character.xp += amount;
    const messages = [];
    while (character.xp >= character.xpToNext) {
        character.xp -= character.xpToNext;
        character.level++;
        character.xpToNext = character.level * 30;

        if (character.isAlly) {
            // Grant 1 Skill Point — no auto-stat growth
            character.skillPoints = (character.skillPoints || 0) + 1;
            character.currentHp = character.maxHp;
            character.currentChakra = character.maxChakra;
            messages.push(`${character.name} leveled up to ${character.level}! +1 SP`);
        } else {
            // Enemies still use growth rates
            const template = ENEMY_TEMPLATES[character.templateId];
            if (template) {
                const g = template.growthRates || { hp: 1, chakra: 0, attack: 0, defense: 0, speed: 0, evasion: 1 };
                character.stats.hp += g.hp;
                character.stats.chakra += g.chakra || 0;
                character.stats.attack += g.attack;
                character.stats.defense += g.defense;
                character.stats.speed += g.speed;
                character.stats.evasion += g.evasion || 0;
                character.maxHp = character.stats.hp;
                character.maxChakra = character.stats.chakra;
            }
            messages.push(`${character.name} leveled up to ${character.level}!`);
        }
    }
    return messages;
}

/**
 * Check if a skill node can be unlocked by a character.
 */
export function canUnlockNode(character, nodeId) {
    const tree = SKILL_TREES[character.templateId];
    if (!tree) return false;

    const node = tree.find(n => n.id === nodeId);
    if (!node) return false;

    const unlocked = character.unlockedNodes || [];

    // Already unlocked
    if (unlocked.includes(nodeId)) return false;

    // Not enough SP
    if ((character.skillPoints || 0) < 1) return false;

    // Prerequisites not met
    if (node.requires.length > 0 && !node.requires.every(r => unlocked.includes(r))) return false;

    // Exclusive group: check if another node in same group is already unlocked
    if (node.exclusive) {
        const groupNodes = tree.filter(n => n.exclusive === node.exclusive);
        if (groupNodes.some(n => unlocked.includes(n.id))) return false;
    }

    return true;
}

/**
 * Unlock a skill tree node and apply its effect to the character.
 * Returns a description string of what was gained, or null if failed.
 */
export function unlockNode(character, nodeId) {
    if (!canUnlockNode(character, nodeId)) return null;

    const tree = SKILL_TREES[character.templateId];
    const node = tree.find(n => n.id === nodeId);

    character.skillPoints--;
    if (!character.unlockedNodes) character.unlockedNodes = [];
    character.unlockedNodes.push(nodeId);
    if (!character.passives) character.passives = [];

    switch (node.type) {
        case 'stat': {
            const { stat, value } = node.effect;
            character.stats[stat] += value;
            if (stat === 'hp') {
                character.maxHp = character.stats.hp;
                character.currentHp = Math.min(character.currentHp + value, character.maxHp);
            }
            if (stat === 'chakra') {
                character.maxChakra = character.stats.chakra;
                character.currentChakra = Math.min(character.currentChakra + value, character.maxChakra);
            }
            break;
        }
        case 'jutsu_upgrade': {
            const { jutsu: jutsuName, property, value } = node.effect;
            const jutsu = character.jutsu.find(j => j.name === jutsuName);
            if (jutsu) {
                if (typeof value === 'object') {
                    jutsu[property] = { ...value };
                } else {
                    jutsu[property] = value;
                }
            }
            break;
        }
        case 'jutsu': {
            const newJutsu = { ...node.effect.jutsu };
            if (newJutsu.effect) newJutsu.effect = { ...newJutsu.effect };
            character.jutsu.push(newJutsu);
            break;
        }
        case 'passive': {
            character.passives.push({ ...node.effect });
            break;
        }
    }

    return node.description;
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
