// constants.js - Constantes pour les bonus de ligue
export const LEAGUE_NAMES = {
    wood: "Bois",
    rock: "Roche",
    iron: "Fer",
    bronze: "Bronze",
    silver: "Argent",
    gold: "Or",
    diamond: "Diamant",
    elite: "Élite",
    infinite: "Infini",
    legendary: "Légendaire",
    royal: "Royal"
};

export const LEAGUE_EMOJIS = {
    wood: "🌲",
    rock: "🗿",
    iron: "⚔️",
    bronze: "🥉",
    silver: "🥈",
    gold: "🥇",
    diamond: "💎",
    elite: "💯",
    infinite: "🌀",
    legendary: "🏆",
    royal: "👑"
};

// Configuration des récompenses par ligue (valeurs officielles de Crownicles)
// Source: LeagueInfoConstants.ts
export const LEAGUE_REWARDS = {
    wood: {
        money: 250,
        experience: 200,
        minItemRarity: 2,
        maxItemRarity: 3
    },
    rock: {
        money: 300,
        experience: 350,
        minItemRarity: 2,
        maxItemRarity: 4
    },
    iron: {
        money: 500,
        experience: 500,
        minItemRarity: 3,
        maxItemRarity: 4
    },
    bronze: {
        money: 600,
        experience: 650,
        minItemRarity: 3,
        maxItemRarity: 5
    },
    silver: {
        money: 800,
        experience: 750,
        minItemRarity: 3,
        maxItemRarity: 6
    },
    gold: {
        money: 1000,
        experience: 1000,
        minItemRarity: 4,
        maxItemRarity: 6
    },
    diamond: {
        money: 1300,
        experience: 1300,
        minItemRarity: 4,
        maxItemRarity: 7
    },
    elite: {
        money: 1500,
        experience: 1450,
        minItemRarity: 4,
        maxItemRarity: 8
    },
    infinite: {
        money: 1700,
        experience: 1750,
        minItemRarity: 5,
        maxItemRarity: 8
    },
    legendary: {
        money: 2000,
        experience: 2000,
        minItemRarity: 5,
        maxItemRarity: 8
    },
    royal: {
        money: 2025,
        experience: 2050,
        minItemRarity: 5,
        maxItemRarity: 8
    }
};

// Noms des raretés d'objets
export const RARITY_NAMES = [
    "Basique",      // 0
    "Commun",       // 1
    "Peu commun",   // 2
    "Exotique",     // 3
    "Rare",         // 4
    "Spécial",      // 5
    "Épique",       // 6
    "Légendaire",   // 7
    "Mythique"      // 8
];

// Icônes des raretés (source: CrowniclesIcons.ts)
export const RARITY_ICONS = [
    "🔸",  // 0 - Basique
    "🔶",  // 1 - Commun
    "🔥",  // 2 - Peu commun
    "🔱",  // 3 - Exotique
    "☄️",  // 4 - Rare
    "💫",  // 5 - Spécial
    "⭐",  // 6 - Épique
    "🌟",  // 7 - Légendaire
    "💎"   // 8 - Mythique
];

// Couleurs des raretés
export const RARITY_COLORS = [
    "#9ca3af",  // 0 - Basique (gris)
    "#ffffff",  // 1 - Commun (blanc)
    "#22c55e",  // 2 - Peu commun (vert)
    "#3b82f6",  // 3 - Exotique (bleu)
    "#a855f7",  // 4 - Rare (violet)
    "#ec4899",  // 5 - Spécial (rose)
    "#f59e0b",  // 6 - Épique (orange)
    "#eab308",  // 7 - Légendaire (jaune)
    "#06b6d4"   // 8 - Mythique (cyan)
];

// Rang maximum pour recevoir des points bonus
export const MAX_RANK_FOR_POINTS = 200;

// Probabilités officielles de Crownicles (ItemConstants.RARITY.GENERATOR)
export const RARITY_GENERATOR = {
    VALUES: [
        4375,  // Uncommon (Peu commun)
        6875,  // Exotic (Exotique)
        8375,  // Rare
        9375,  // Special (Spécial)
        9875,  // Epic (Épique)
        9975,  // Legendary (Légendaire)
        9998,  // Mythic (Mythique)
        10000
    ],
    MAX_VALUE: 10000
};
