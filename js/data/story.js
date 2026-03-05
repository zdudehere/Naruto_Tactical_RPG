/**
 * Dialogue trees and story data.
 * Each dialogue is an array of lines with speaker and text.
 * Special actions can trigger battles, set flags, etc.
 */
export const DIALOGUES = {
    kakashi_intro: {
        lines: [
            { speaker: 'Kakashi', text: "Ah, there you are. Team 7, assemble." },
            { speaker: 'Kakashi', text: "We've received a mission from the Hokage. Rogue ninja have been spotted near the village gate." },
            { speaker: 'Naruto', text: "Alright! Finally a real mission! I've been waiting for this, believe it!" },
            { speaker: 'Sasuke', text: "...Let's just get it done." },
            { speaker: 'Sakura', text: "I'm ready, Kakashi Sensei!" },
            { speaker: 'Kakashi', text: "Head to the village gate when you're ready. And remember - teamwork is key." },
        ],
        onComplete: { action: 'setFlag', flag: 'talked_to_kakashi' }
    },

    villager_hint: {
        lines: [
            { speaker: 'Villager', text: "I heard there are rogue ninja lurking outside the village gates..." },
            { speaker: 'Villager', text: "You should talk to Kakashi Sensei before heading out. He's near the Hokage building." }
        ]
    },

    gate_guard_intro: {
        lines: [
            { speaker: 'Gate Guard', text: "Halt! The village gate is under high alert." },
            { speaker: 'Gate Guard', text: "Rogue ninja have been spotted in the area. Only authorized shinobi may pass." },
            { speaker: 'Gate Guard', text: "Speak to your sensei before heading out on any missions." }
        ]
    },

    hokage_building: {
        lines: [
            { speaker: '', text: "The Hokage Building looms before you. The Will of Fire burns bright within." },
            { speaker: '', text: "A sign reads: 'Mission assignments on the second floor.'" }
        ]
    },

    ramen_shop: {
        lines: [
            { speaker: 'Teuchi', text: "Welcome to Ichiraku Ramen! The finest ramen in all of Konoha!" },
            { speaker: 'Naruto', text: "Old man Teuchi! Give me five bowls of miso ramen!" },
            { speaker: 'Teuchi', text: "Ha! Save that appetite for after your mission, Naruto." }
        ],
        onComplete: {
            action: 'heal',
            message: "Team 7's HP and Chakra fully restored!"
        }
    },

    gate_not_ready: {
        lines: [
            { speaker: '', text: "You should speak to Kakashi Sensei before leaving the village." }
        ]
    },

    gate_battle: {
        lines: [
            { speaker: 'Gate Guard', text: "Team 7! The rogue ninja are just beyond the gate. Be careful!" },
            { speaker: 'Naruto', text: "Let's go, team! Time to show them what we've got!" },
            { speaker: 'Sasuke', text: "Stay focused. Don't do anything reckless, Naruto." },
            { speaker: 'Sakura', text: "I'll support you both. Let's do this!" }
        ],
        onComplete: {
            action: 'startBattle',
            encounter: 'first_battle'
        }
    },

    battle_victory_1: {
        lines: [
            { speaker: 'Naruto', text: "Yeah! We did it! Those guys didn't stand a chance!" },
            { speaker: 'Sasuke', text: "They were just low-level rogues. Don't get cocky." },
            { speaker: 'Sakura', text: "Good teamwork, everyone!" },
            { speaker: 'Kakashi', text: "Well done, Team 7. But this was just the beginning." },
            { speaker: 'Kakashi', text: "Our intelligence suggests there's a Jonin-level ninja leading these rogues." },
            { speaker: 'Kakashi', text: "Rest up and prepare. The real battle is yet to come." },
            { speaker: 'Naruto', text: "Bring it on! I'm not scared of any Jonin!" }
        ],
        onComplete: {
            action: 'setFlag',
            flag: 'completed_first_battle'
        }
    },

    battle_victory_2: {
        lines: [
            { speaker: 'Naruto', text: "That was tougher than I expected..." },
            { speaker: 'Sasuke', text: "Not bad. We're getting stronger." },
            { speaker: 'Sakura', text: "Let me heal everyone up." },
            { speaker: 'Kakashi', text: "Impressive work. Your teamwork is improving." },
            { speaker: 'Kakashi', text: "The village is safe... for now. Keep training." }
        ],
        onComplete: {
            action: 'setFlag',
            flag: 'completed_second_battle'
        }
    },

    game_complete: {
        lines: [
            { speaker: 'Kakashi', text: "Team 7, you've proven yourselves as true shinobi today." },
            { speaker: 'Naruto', text: "One step closer to becoming Hokage! Believe it!" },
            { speaker: 'Sasuke', text: "...Not bad, for a team." },
            { speaker: 'Sakura', text: "We make a great team, don't we?" },
            { speaker: 'Kakashi', text: "The Will of Fire burns bright in all of you. I'm proud." },
            { speaker: '', text: "Thank you for playing! The adventure continues..." }
        ]
    }
};

/**
 * Battle encounter definitions
 */
export const ENCOUNTERS = {
    first_battle: {
        name: 'Rogue Ninja Attack!',
        enemies: [
            { template: 'bandit', level: 1, gridX: 9, gridY: 2 },
            { template: 'bandit', level: 1, gridX: 10, gridY: 4 },
            { template: 'rogue_ninja', level: 1, gridX: 11, gridY: 3 }
        ],
        allyPositions: [
            { gridX: 1, gridY: 2 },
            { gridX: 1, gridY: 4 },
            { gridX: 2, gridY: 3 }
        ],
        victoryDialogue: 'battle_victory_1',
        background: 'forest'
    },
    second_battle: {
        name: 'Jonin Ambush!',
        enemies: [
            { template: 'rogue_ninja', level: 2, gridX: 9, gridY: 1 },
            { template: 'rogue_ninja', level: 2, gridX: 10, gridY: 5 },
            { template: 'rogue_ninja', level: 2, gridX: 11, gridY: 3 },
            { template: 'jonin', level: 3, gridX: 10, gridY: 3 }
        ],
        allyPositions: [
            { gridX: 1, gridY: 2 },
            { gridX: 1, gridY: 4 },
            { gridX: 2, gridY: 3 }
        ],
        victoryDialogue: 'battle_victory_2',
        background: 'forest'
    },
    training_battle: {
        name: 'Training Exercise',
        enemies: [
            { template: 'bandit', level: 1, gridX: 9, gridY: 3 },
            { template: 'bandit', level: 1, gridX: 10, gridY: 4 }
        ],
        allyPositions: [
            { gridX: 1, gridY: 2 },
            { gridX: 1, gridY: 4 },
            { gridX: 2, gridY: 3 }
        ],
        victoryDialogue: null,
        background: 'field'
    }
};
