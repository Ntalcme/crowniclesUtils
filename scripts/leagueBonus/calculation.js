// calculations.js
import {
    LEAGUE_REWARDS,
    MAX_RANK_FOR_POINTS,
    RARITY_NAMES,
    RARITY_ICONS,
    RARITY_COLORS,
    RARITY_GENERATOR
} from './constants.js';

/**
 * Calcule les points bonus officiels Crownicles
 * Formule : 2995 - √(80000 × (rank - 1)) + 5 × rank
 * Arrondi à la dizaine supérieure
 */
export function calculateBonusPoints(rank) {
    if (rank > MAX_RANK_FOR_POINTS) return 0;

    const raw = 2995 - Math.sqrt(80000 * (rank - 1)) + 5 * rank;
    return Math.ceil(raw / 10) * 10;
}

/**
 * Calcule les probabilités de rareté selon l’algorithme officiel
 */
function calculateRarityProbabilities(minRarity, maxRarity) {
    const minValue =
        1 + (minRarity === 1 ? -1 : RARITY_GENERATOR.VALUES[minRarity - 2]);

    const maxValue =
        RARITY_GENERATOR.MAX_VALUE -
        (maxRarity === 8
            ? 0
            : RARITY_GENERATOR.MAX_VALUE - RARITY_GENERATOR.VALUES[maxRarity - 1]);

    const totalRange = maxValue - minValue + 1;

    let previous = minValue - 1;
    const probabilities = [];

    for (let rarity = minRarity; rarity <= maxRarity; rarity++) {
        const threshold = RARITY_GENERATOR.VALUES[rarity - 1];
        const range = threshold - previous;
        probabilities.push((range / totalRange) * 100);
        previous = threshold;
    }

    return probabilities;
}

/**
 * Calcul principal des récompenses
 */
export function calculateRewards(leagueKey, rank) {
    const league = LEAGUE_REWARDS[leagueKey];
    if (!league) {
        return {
            money: 0,
            experience: 0,
            points: 0,
            itemRarities: []
        };
    }

    const bonusPoints = calculateBonusPoints(rank);
    const probabilities = calculateRarityProbabilities(
        league.minItemRarity,
        league.maxItemRarity
    );

    const itemRarities = [];
    for (let i = league.minItemRarity; i <= league.maxItemRarity; i++) {
        itemRarities.push({
            rarity: i,
            name: RARITY_NAMES[i],
            icon: RARITY_ICONS[i],
            color: RARITY_COLORS[i],
            probability: probabilities[i - league.minItemRarity]
        });
    }

    return {
        money: league.money,
        experience: league.experience,
        points: bonusPoints,
        itemRarities,
        minItemRarity: league.minItemRarity,
        maxItemRarity: league.maxItemRarity
    };
}
