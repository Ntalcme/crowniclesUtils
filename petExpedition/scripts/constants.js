// constants.js - Définitions des constantes de l'application
export const EXPEDITION_CONSTANTS = {
    DURATION: { MIN_MINUTES: 10, MAX_MINUTES: 4320 },
    RISK_RATE: { MIN: 0, MAX: 100 },
    DIFFICULTY: { MIN: 0, MAX: 100 },
    WEALTH_RATE: { MIN: 0, MAX: 2 },
    WEALTH_RATE_REWARD_INDEX_BONUS: 0.30,
    EFFECTIVE_RISK_FORMULA: { DIFFICULTY_DIVISOR: 4, LOVE_DIVISOR: 10 },
    NO_FOOD_RISK_MULTIPLIER: 3,
    SPEED_DURATION_MODIFIER: {
        BASE_MULTIPLIER: 1.20,
        REDUCTION_PER_SPEED_POINT: 0.5 / 30
    },
    LOVE_CHANGES: {
        CANCEL_BEFORE_DEPARTURE_BASE: -15,
        RECALL_DURING_EXPEDITION: -25,
        TOTAL_FAILURE: -3,
        PARTIAL_SUCCESS: 2,
        TOTAL_SUCCESS: 5,
        LIKED_EXPEDITION_MULTIPLIER: 2  // Multiplicateur pour expéditions aimées
    },
    // Préférences de familier pour les expéditions
    PET_PREFERENCES: {
        LIKED_EXPEDITION_FAILURE_REDUCTION: 5,      // -5% risque si terrain aimé
        DISLIKED_SHORT_EXPEDITION_FAILURE_BONUS: 10, // +10% risque si terrain détesté ET durée < 12h
        DISLIKED_EXPEDITION_DURATION_THRESHOLD_MINUTES: 720, // 12 heures
        REWARD_MULTIPLIERS: {
            liked: 1.0,
            neutral: 0.8,
            disliked: 0.25
        }
    },
    // Génération de risque basée sur le terrain (power transformation)
    TERRAIN_DIFFICULTY: {
        plains: { skewFactor: 0.5 },   // Le plus sûr
        coast: { skewFactor: 0.65 },
        forest: { skewFactor: 0.75 },
        desert: { skewFactor: 1.0 },   // Neutre
        mountain: { skewFactor: 1.2 },
        swamp: { skewFactor: 1.4 },
        ruins: { skewFactor: 1.6 },
        cave: { skewFactor: 1.8 }      // Le plus dangereux
    },
    CLONE_TALISMAN: {
        BASE_DROP_CHANCE: 0.5,
        REWARD_INDEX_BONUS_PER_POINT: 0.5,
        BONUS_EXPEDITION_CHANCE: 20,
        BONUS_EXPEDITION_MULTIPLIER: 10
    },
    BONUS_TOKENS: {
        TOKEN_BONUS_EXPEDITION_CHANCE: 8,
        MULTIPLIER: 3,
        MIN_TOKEN_REWARD: 1,
        MIN_BONUS_TOKEN_REWARD: 2,
        RANDOM_BOOST_MIN: 0,
        RANDOM_BOOST_MAX: 2
    },
    TOKENS: {
        MAX: 20,
        LEVEL_TO_UNLOCK: 5,
        EXPEDITION: {
            REWARD_INDEX_OFFSET: -1,
            SHORT_DURATION_THRESHOLD_MINUTES: 60,
            SHORT_DURATION_MALUS: 1,
            LOW_REWARD_INDEX_MALUS: 1
        }
    },
    ITEM_REWARD: {
        MIN_RARITY_OFFSET: 4,
        MIN_RARITY_FLOOR: 1,
        MAX_RARITY_BY_REWARD_INDEX: [5, 5, 6, 7, 8, 8, 8, 8, 8, 8]
    },
    REWARD_TABLES: {
        MONEY: [50, 120, 235, 435, 710, 1300, 2100, 3200, 4200, 5000],
        EXPERIENCE: [50, 150, 350, 600, 950, 1400, 1950, 2550, 3000, 3500],
        POINTS: [6, 20, 75, 145, 210, 340, 420, 585, 650, 710]
    },
    FOOD_CONSUMPTION: [1, 3, 5, 6, 8, 10, 12, 15, 25, 32],
    NEUTRAL_WEALTH_RATE: 1,
    REWARD_INDEX: {
        MIN: 0,
        MAX: 9,
        DURATION_WEIGHT: 3,
        BASE_OFFSET: 2
    },
    DURATION_RANGES: {
        SHORT: { MIN: 10, MAX: 60 },
        MEDIUM: { MIN: 15, MAX: 600 },
        LONG: { MIN: 720, MAX: 4320 }
    },
    MAP_TYPE_TO_EXPEDITION_TYPE: {
        fo: "forest",
        mo: "mountain",
        de: "desert",
        ruins: "ruins",
        be: "coast",
        ri: "coast",
        la: "swamp",
        pl: "plains",
        ro: "plains",
        vi: "plains",
        ci: "cave",
        castleEntrance: "ruins",
        castleThrone: "ruins",
        continent: "plains"
    },
    NO_MAP_LOCATION: 0,
    DEFAULT_MAP_LOCATION_ID: 1,
    DEFAULT_MAP_TYPE: "ro",
    LOCAL_EXPEDITIONS_COUNT: 2,
    NO_BONUS_EXPEDITION: -1,
    TOTAL_EXPEDITIONS_COUNT: 3,
    DURATION_DISPLAY_ROUNDING: 10,
    LOCATION_REWARD_WEIGHTS: {
        forest: { money: 0.8, experience: 1.3, points: 0.9 },
        mountain: { money: 1.9, experience: 1, points: 0.3 },
        desert: { money: 0.6, experience: 0.4, points: 1.5 },
        swamp: { money: 0.4, experience: 1, points: 1.6 },
        ruins: { money: 1.7, experience: 1, points: 0.5 },
        cave: { money: 2.2, experience: 0.5, points: 0.2 },
        plains: { money: 1, experience: 1, points: 1 },
        coast: { money: 1.2, experience: 0.7, points: 0.8 }
    },
    LOCATION_EMOJIS: {
        forest: "🌲",
        mountain: "⛰️",
        desert: "🏜️",
        swamp: "🌿",
        ruins: "🏛️",
        cave: "🕳️",
        plains: "🌾",
        coast: "🌊"
    },
    // 8 catégories de risque (nouveau système)
    RISK_CATEGORIES: [
        { max: 10, name: "Anodin", emoji: "😌" },
        { max: 20, name: "Très faible", emoji: "🙂" },
        { max: 32, name: "Faible", emoji: "😐" },
        { max: 45, name: "Modéré", emoji: "🤔" },
        { max: 58, name: "Élevé", emoji: "😰" },
        { max: 72, name: "Très élevé", emoji: "😨" },
        { max: 86, name: "Extrême", emoji: "😱" },
        { max: 100, name: "Désespéré", emoji: "💀" }
    ],
    DIFFICULTY_CATEGORIES: [
        { max: 20, name: "Aisé" },
        { max: 40, name: "Accessible" },
        { max: 60, name: "Exigeant" },
        { max: 80, name: "Ardu" },
        { max: 100, name: "Impitoyable" }
    ],
    WEALTH_CATEGORIES: [
        { max: 0.5, name: "Pauvre" },
        { max: 1.0, name: "Modeste" },
        { max: 1.5, name: "Riche" },
        { max: 2.0, name: "Légendaire" }
    ],
    REWARD_CATEGORIES: [
        { max: 1, name: "Maigres" },
        { max: 3, name: "Modestes" },
        { max: 5, name: "Correctes" },
        { max: 7, name: "Abondantes" },
        { max: 9, name: "Exceptionnelles" }
    ]
};

export const RARITY_NAMES = [
    "Basique",
    "Commun",
    "Peu commun",
    "Exotique",
    "Rare",
    "Spécial",
    "Épique",
    "Légendaire",
    "Mythique"
];

export const LOCATION_NAMES = {
    plains: "Plaine",
    forest: "Forêt",
    mountain: "Montagne",
    desert: "Désert",
    swamp: "Marais",
    ruins: "Ruines",
    cave: "Caverne",
    coast: "Côte"
};

// Descriptions des bonus par type de lieu
export const LOCATION_DESCRIPTIONS = {
    plains: "Zone équilibrée sans bonus particulier",
    forest: "Bonus d'XP, moins d'argent",
    mountain: "Bonus d'argent important, moins de points",
    desert: "Bonus de points et tokens, moins d'argent et d'XP",
    swamp: "Bonus de points, moins d'argent",
    ruins: "Bonus d'argent, moyenne sur le reste",
    cave: "Gros bonus d'argent, malus XP et points",
    coast: "Léger bonus d'argent, équilibré"
};
