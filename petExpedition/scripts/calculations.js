// calculations.js - Fonctions de calcul et scoring
import { EXPEDITION_CONSTANTS } from './constants.js';
import { calculateLinearScore, getCategoryName } from './utils.js';

export function calculateRewardIndex(durationMinutes, riskRate, difficulty, wealthRate) {
    const durationScore = calculateLinearScore(
        durationMinutes,
        EXPEDITION_CONSTANTS.DURATION.MIN_MINUTES,
        EXPEDITION_CONSTANTS.DURATION.MAX_MINUTES
    );
    const riskScore = calculateLinearScore(
        riskRate,
        EXPEDITION_CONSTANTS.RISK_RATE.MIN,
        EXPEDITION_CONSTANTS.RISK_RATE.MAX
    );
    const difficultyScore = calculateLinearScore(
        difficulty,
        EXPEDITION_CONSTANTS.DIFFICULTY.MIN,
        EXPEDITION_CONSTANTS.DIFFICULTY.MAX
    );

    const baseIndex = (durationScore * 3) + riskScore + difficultyScore;
    const wealthRateMultiplier = 1 + (wealthRate - 1) * EXPEDITION_CONSTANTS.WEALTH_RATE_REWARD_INDEX_BONUS;
    const adjustedIndex = baseIndex * wealthRateMultiplier;

    return Math.max(0, Math.min(9, Math.round(adjustedIndex)));
}

export function calculateEffectiveRisk(riskRate, difficulty, petForce, lovePoints, foodConsumed, foodRequired) {
    let effectiveRisk = riskRate
        + difficulty / EXPEDITION_CONSTANTS.EFFECTIVE_RISK_FORMULA.DIFFICULTY_DIVISOR
        - petForce
        - lovePoints / EXPEDITION_CONSTANTS.EFFECTIVE_RISK_FORMULA.LOVE_DIVISOR;

    const hasInsufficientFood = foodConsumed !== undefined
        && foodRequired !== undefined
        && foodConsumed < foodRequired;

    if (hasInsufficientFood) {
        effectiveRisk *= EXPEDITION_CONSTANTS.NO_FOOD_RISK_MULTIPLIER;
    }

    return Math.max(0, Math.min(100, effectiveRisk));
}

export function calculateSpeedDurationModifier(petSpeed) {
    const speedConfig = EXPEDITION_CONSTANTS.SPEED_DURATION_MODIFIER;
    return speedConfig.BASE_MULTIPLIER - petSpeed * speedConfig.REDUCTION_PER_SPEED_POINT;
}

export function calculateRewards(rewardIndex, locationType) {
    const weights = EXPEDITION_CONSTANTS.LOCATION_REWARD_WEIGHTS[locationType];
    return {
        money: Math.round(EXPEDITION_CONSTANTS.REWARD_TABLES.MONEY[rewardIndex] * weights.money),
        experience: Math.round(EXPEDITION_CONSTANTS.REWARD_TABLES.EXPERIENCE[rewardIndex] * weights.experience),
        points: Math.round(EXPEDITION_CONSTANTS.REWARD_TABLES.POINTS[rewardIndex] * weights.points)
    };
}

export function calculateItemRarityRange(rewardIndex) {
    const minRarity = Math.max(
        EXPEDITION_CONSTANTS.ITEM_REWARD.MIN_RARITY_FLOOR,
        rewardIndex - EXPEDITION_CONSTANTS.ITEM_REWARD.MIN_RARITY_OFFSET
    );
    const maxRarity = EXPEDITION_CONSTANTS.ITEM_REWARD.MAX_RARITY_BY_REWARD_INDEX[rewardIndex];
    return { minRarity, maxRarity };
}

export function calculateTalismanDropChance(rewardIndex, hasBonus) {
    let chance = EXPEDITION_CONSTANTS.CLONE_TALISMAN.BASE_DROP_CHANCE
        + rewardIndex * EXPEDITION_CONSTANTS.CLONE_TALISMAN.REWARD_INDEX_BONUS_PER_POINT;
    if (hasBonus) {
        chance *= EXPEDITION_CONSTANTS.CLONE_TALISMAN.BONUS_EXPEDITION_MULTIPLIER;
    }
    return chance;
}

export function calculateProfitabilityScore(
    rewardIndex,
    totalSuccessRate,
    partialSuccessRate,
    failureRate,
    effectiveDuration,
    rewards,
    talismanChance = 0,
    hasTalismanBonus = false
) {
    const details = {
        rewardScore: 0,
        successScore: 0,
        timeEfficiency: 0,
        talismanBonus: 0,
        safetyBonus: 0,
        sweetSpotBonus: 0,
        failurePenalty: 0,
        issues: [],
        positives: []
    };

    details.rewardScore = (rewardIndex + 1) / 10;
    if (rewardIndex >= 7) details.positives.push('Récompenses élevées');
    else if (rewardIndex <= 2) details.issues.push('Récompenses faibles');

    details.successScore = (totalSuccessRate / 100) + (partialSuccessRate / 100) * 0.5;
    if (totalSuccessRate >= 90) details.positives.push('Succès quasi-garanti');
    else if (totalSuccessRate < 50) details.issues.push('Risque d’échec élevé');

    const expectedDurationForIndex = 10 + (rewardIndex * 450);
    const durationRatio = expectedDurationForIndex / effectiveDuration;
    const timeEfficiency = Math.min(1.2, Math.max(0.5, durationRatio));
    details.timeEfficiency = (timeEfficiency - 0.5) / 0.7;
    if (effectiveDuration > 2880) details.issues.push('Expédition très longue');
    else if (effectiveDuration <= 60 && rewardIndex >= 3) details.positives.push('Bon ratio temps/récompense');

    if (talismanChance > 0) {
        const effectiveTalismanChance = (talismanChance * totalSuccessRate) / 100;
        details.talismanBonus = Math.min(0.1, effectiveTalismanChance / 100);
        if (hasTalismanBonus && effectiveTalismanChance > 20) {
            details.positives.push('Bonus talisman ×10 actif');
            details.talismanBonus *= 1.5;
        } else if (effectiveTalismanChance > 5) {
            details.positives.push('Chance de talisman notable');
        }
    }

    const baseScore = (details.rewardScore * 0.35)
        + (details.successScore * 0.35)
        + (details.timeEfficiency * 0.15)
        + (details.talismanBonus * 0.15 / 0.15);

    details.safetyBonus = totalSuccessRate > 95 ? 0.08 : (totalSuccessRate > 85 ? 0.04 : 0);
    details.failurePenalty = failureRate > 40 ? (failureRate - 40) / 200 : 0;
    details.sweetSpotBonus = (rewardIndex >= 4 && rewardIndex <= 7 && totalSuccessRate > 70) ? 0.05 : 0;

    if (details.sweetSpotBonus > 0) details.positives.push('Zone optimale (index 4-7)');
    if (failureRate > 60) details.issues.push(`Échec probable (> ${failureRate.toFixed(0)}%)`);

    const finalScore = Math.max(0, Math.min(1, baseScore + details.safetyBonus + details.sweetSpotBonus + details.talismanBonus - details.failurePenalty));

    return { score: finalScore, details };
}

function getScoreLabel(score) {
    if (score >= 0.8) return { label: 'Excellente', color: 'var(--success)', emoji: '🌟' };
    if (score >= 0.6) return { label: 'Bonne', color: '#22c55e', emoji: '✅' };
    if (score >= 0.4) return { label: 'Correcte', color: 'var(--warning)', emoji: '👍' };
    if (score >= 0.2) return { label: 'Médiocre', color: '#f97316', emoji: '⚠️' };
    return { label: 'Mauvaise', color: 'var(--danger)', emoji: '❌' };
}

function generateScoreExplanation(score, details) {
    const { label } = getScoreLabel(score);
    if (score >= 0.8) {
        return `Expédition optimale ! ${details.positives.join(', ') || 'Excellent équilibre risque/récompense.'}`;
    }
    if (score >= 0.6) {
        const warning = details.issues.length ? ` Attention : ${details.issues[0].toLowerCase()}.` : '';
        return `Bon choix. ${(details.positives[0] || 'Équilibre correct.')} ${warning}`.trim();
    }
    if (score >= 0.4) {
        const issues = details.issues.length ? details.issues.join(', ') : 'Ratio risque/récompense moyen';
        return `Acceptable mais perfectible. ${issues}.`;
    }
    if (score >= 0.2) {
        const issues = details.issues.length ? details.issues.join(', ') : 'Mauvais ratio risque/récompense';
        return `Déconseillée. ${issues}.`;
    }
    const issues = details.issues.length ? details.issues.join(', ') : 'Trop risqué pour les gains espérés';
    return `À éviter ! ${issues}.`;
}

export function formatScoreDisplay(scoreResult, showExplanation = true) {
    const score = typeof scoreResult === 'number' ? scoreResult : scoreResult.score;
    const details = typeof scoreResult === 'number' ? { positives: [], issues: [] } : scoreResult.details;
    const { label, color, emoji } = getScoreLabel(score);
    const percentage = (score * 100).toFixed(1);
    const explanation = showExplanation ? generateScoreExplanation(score, details) : '';

    return `
        <div style="display: flex; align-items: center; gap: 10px; margin-bottom: ${showExplanation ? '10px' : '0'};">
            <div style="flex: 1; height: 20px; background: var(--bg-tertiary); border-radius: 10px; overflow: hidden;">
                <div style="width: ${percentage}%; height: 100%; background: ${color}; transition: width 0.3s;"></div>
            </div>
            <span style="font-weight: bold; color: ${color};">${percentage}%</span>
            <span>${emoji} ${label}</span>
        </div>
        ${showExplanation ? `<p style="font-size: 0.9em; color: var(--text-secondary); margin: 0;">${explanation}</p>` : ''}
    `;
}

export function describeRewardCategory(rewardIndex) {
    return getCategoryName(rewardIndex, EXPEDITION_CONSTANTS.REWARD_CATEGORIES);
}
