// calculations.js - Calculs des bonus de ligue (formules officielles de Crownicles)
import { LEAGUE_REWARDS, MAX_RANK_FOR_POINTS, RARITY_NAMES, RARITY_ICONS, RARITY_COLORS, RARITY_GENERATOR } from './constants.js';

/**
 * Calcule les points bonus selon le rang (top 200 uniquement)
 * Formule officielle: 2995 - √(80000 × (rank - 1)) + 5 × rank, arrondi à la dizaine
 * @param {number} rank - Position dans le classement
 * @returns {number} Points bonus
 */
export function calculateBonusPoints(rank) {
    if (rank > MAX_RANK_FOR_POINTS) {
        return 0;
    }
    
    const rawPoints = 2995 - Math.sqrt(80000 * (rank - 1)) + 5 * rank;
    return Math.ceil(rawPoints / 10) * 10;
}

/**
 * Calcule les probabilités de rareté selon l'algorithme officiel de Crownicles
 * Basé sur generateRandomRarity dans ItemUtils.ts
 * @param {number} minRarity - Rareté minimale (0-8)
 * @param {number} maxRarity - Rareté maximale (0-8)
 * @returns {number[]} Tableau des probabilités en pourcentage
 */
function calculateRarityProbabilities(minRarity, maxRarity) {
    // Calcul de la plage de valeurs du générateur pour les raretés disponibles
    const minValue = 1 + (minRarity === 1 ? -1 : RARITY_GENERATOR.VALUES[minRarity - 2]);
    const maxValue = RARITY_GENERATOR.MAX_VALUE - 
        (maxRarity === 8 ? 0 : RARITY_GENERATOR.MAX_VALUE - RARITY_GENERATOR.VALUES[maxRarity - 1]);
    const totalRange = maxValue - minValue + 1;
    
    const probabilities = [];
    let previousThreshold = minValue - 1;
    
    for (let rarity = minRarity; rarity <= maxRarity; rarity++) {
        const currentThreshold = RARITY_GENERATOR.VALUES[rarity - 1];
        const rangeForRarity = currentThreshold - previousThreshold;
        const probability = (rangeForRarity / totalRange) * 100;
        probabilities.push(probability);
        previousThreshold = currentThreshold;
    }
    
    return probabilities;
}

/**
 * Calcule toutes les récompenses
 * @param {string} league - Identifiant de la ligue
 * @param {number} rank - Position dans le classement
 * @returns {Object} Récompenses calculées
 */
export function calculateRewards(league, rank) {
    const leagueData = LEAGUE_REWARDS[league];
    if (!leagueData) {
        return { 
            money: 0, 
            experience: 0, 
            points: 0,
            itemRarities: []
        };
    }

    const bonusPoints = calculateBonusPoints(rank);
    const minRarity = leagueData.minItemRarity;
    const maxRarity = leagueData.maxItemRarity;
    
    // Calcul des probabilités selon l'algorithme officiel de Crownicles
    // La fonction generateRandomRarity utilise une distribution pondérée
    const probabilities = calculateRarityProbabilities(minRarity, maxRarity);
    
    const itemRarities = [];
    for (let i = minRarity; i <= maxRarity; i++) {
        itemRarities.push({
            rarity: i,
            name: RARITY_NAMES[i],
            icon: RARITY_ICONS[i],
            color: RARITY_COLORS[i],
            probability: probabilities[i - minRarity]
        });
    }

    return {
        money: leagueData.money,
        experience: leagueData.experience,
        points: bonusPoints,
        itemRarities,
        minItemRarity: minRarity,
        maxItemRarity: maxRarity
    };
}

/**
 * Obtient la catégorie de rang
 * @param {number} rank - Position dans le classement
 * @returns {string} Description de la catégorie
 */
export function getRankCategory(rank) {
    if (rank === 1) return "🥇 Champion";
    if (rank <= 3) return "🥈 Podium";
    if (rank <= 10) return "🌟 Top 10";
    if (rank <= 25) return "⭐ Top 25";
    if (rank <= 50) return "✨ Top 50";
    if (rank <= 100) return "💫 Top 100";
    if (rank <= MAX_RANK_FOR_POINTS) return "📊 Top 200";
    return "📊 Classé";
}
