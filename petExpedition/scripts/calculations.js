// calculations.js - Fonctions de calcul et scoring
import { EXPEDITION_CONSTANTS } from './constants.js';
import { calculateLinearScore, getCategoryName } from './utils.js';

// Constantes pour le calcul du score de rentabilité
const SCORE_WEIGHTS = {
    REWARD: 0.35,
    SUCCESS: 0.35,
    TIME_EFFICIENCY: 0.15,
    TALISMAN: 0.15
};

const SCORE_THRESHOLDS = {
    HIGH_REWARD_INDEX: 7,
    LOW_REWARD_INDEX: 2,
    EXCELLENT_SUCCESS_RATE: 90,
    POOR_SUCCESS_RATE: 50,
    VERY_LONG_DURATION: 2880,
    SHORT_DURATION: 60,
    SHORT_DURATION_MIN_REWARD: 3,
    HIGH_TALISMAN_CHANCE: 20,
    NOTABLE_TALISMAN_CHANCE: 5,
    VERY_SAFE_SUCCESS_RATE: 95,
    SAFE_SUCCESS_RATE: 85,
    HIGH_FAILURE_RATE: 40,
    CRITICAL_FAILURE_RATE: 60,
    SWEET_SPOT_MIN_INDEX: 4,
    SWEET_SPOT_MAX_INDEX: 7,
    SWEET_SPOT_MIN_SUCCESS: 70
};

const SCORE_BONUSES = {
    VERY_SAFE: 0.08,
    SAFE: 0.04,
    SWEET_SPOT: 0.05,
    TALISMAN_BONUS_MULTIPLIER: 1.5,
    MAX_TALISMAN_BONUS: 0.1
};

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
    if (rewardIndex >= SCORE_THRESHOLDS.HIGH_REWARD_INDEX) details.positives.push('Récompenses élevées');
    else if (rewardIndex <= SCORE_THRESHOLDS.LOW_REWARD_INDEX) details.issues.push('Récompenses faibles');

    details.successScore = (totalSuccessRate / 100) + (partialSuccessRate / 100) * 0.5;
    if (totalSuccessRate >= SCORE_THRESHOLDS.EXCELLENT_SUCCESS_RATE) details.positives.push('Succès quasi-garanti');
    else if (totalSuccessRate < SCORE_THRESHOLDS.POOR_SUCCESS_RATE) details.issues.push('Risque d\'échec élevé');

    const expectedDurationForIndex = 10 + (rewardIndex * 450);
    const durationRatio = expectedDurationForIndex / effectiveDuration;
    const timeEfficiency = Math.min(1.2, Math.max(0.5, durationRatio));
    details.timeEfficiency = (timeEfficiency - 0.5) / 0.7;
    if (effectiveDuration > SCORE_THRESHOLDS.VERY_LONG_DURATION) details.issues.push('Expédition très longue');
    else if (effectiveDuration <= SCORE_THRESHOLDS.SHORT_DURATION && rewardIndex >= SCORE_THRESHOLDS.SHORT_DURATION_MIN_REWARD) details.positives.push('Bon ratio temps/récompense');

    if (talismanChance > 0) {
        const effectiveTalismanChance = (talismanChance * totalSuccessRate) / 100;
        details.talismanBonus = Math.min(SCORE_BONUSES.MAX_TALISMAN_BONUS, effectiveTalismanChance / 100);
        if (hasTalismanBonus && effectiveTalismanChance > SCORE_THRESHOLDS.HIGH_TALISMAN_CHANCE) {
            details.positives.push('Bonus talisman ×10 actif');
            details.talismanBonus *= SCORE_BONUSES.TALISMAN_BONUS_MULTIPLIER;
        } else if (effectiveTalismanChance > SCORE_THRESHOLDS.NOTABLE_TALISMAN_CHANCE) {
            details.positives.push('Chance de talisman notable');
        }
    }

    const baseScore = (details.rewardScore * SCORE_WEIGHTS.REWARD)
        + (details.successScore * SCORE_WEIGHTS.SUCCESS)
        + (details.timeEfficiency * SCORE_WEIGHTS.TIME_EFFICIENCY)
        + (details.talismanBonus * SCORE_WEIGHTS.TALISMAN / SCORE_WEIGHTS.TALISMAN);

    details.safetyBonus = totalSuccessRate > SCORE_THRESHOLDS.VERY_SAFE_SUCCESS_RATE ? SCORE_BONUSES.VERY_SAFE : (totalSuccessRate > SCORE_THRESHOLDS.SAFE_SUCCESS_RATE ? SCORE_BONUSES.SAFE : 0);
    details.failurePenalty = failureRate > SCORE_THRESHOLDS.HIGH_FAILURE_RATE ? (failureRate - SCORE_THRESHOLDS.HIGH_FAILURE_RATE) / 200 : 0;
    details.sweetSpotBonus = (rewardIndex >= SCORE_THRESHOLDS.SWEET_SPOT_MIN_INDEX && rewardIndex <= SCORE_THRESHOLDS.SWEET_SPOT_MAX_INDEX && totalSuccessRate > SCORE_THRESHOLDS.SWEET_SPOT_MIN_SUCCESS) ? SCORE_BONUSES.SWEET_SPOT : 0;

    if (details.sweetSpotBonus > 0) details.positives.push(`Zone optimale (index ${SCORE_THRESHOLDS.SWEET_SPOT_MIN_INDEX}-${SCORE_THRESHOLDS.SWEET_SPOT_MAX_INDEX})`);
    if (failureRate > SCORE_THRESHOLDS.CRITICAL_FAILURE_RATE) details.issues.push(`Échec probable (> ${failureRate.toFixed(0)}%)`);

    const finalScore = Math.max(0, Math.min(1, baseScore + details.safetyBonus + details.sweetSpotBonus + details.talismanBonus - details.failurePenalty));

    return { score: finalScore, details };
}

const SCORE_LABELS = {
    EXCELLENT: { threshold: 0.8, label: 'Excellente', color: 'var(--success)', emoji: '🌟' },
    GOOD: { threshold: 0.6, label: 'Bonne', color: '#22c55e', emoji: '✅' },
    FAIR: { threshold: 0.4, label: 'Correcte', color: 'var(--warning)', emoji: '👍' },
    POOR: { threshold: 0.2, label: 'Médiocre', color: '#f97316', emoji: '⚠️' },
    BAD: { threshold: 0, label: 'Mauvaise', color: 'var(--danger)', emoji: '❌' }
};

function getScoreLabel(score) {
    if (score >= SCORE_LABELS.EXCELLENT.threshold) return SCORE_LABELS.EXCELLENT;
    if (score >= SCORE_LABELS.GOOD.threshold) return SCORE_LABELS.GOOD;
    if (score >= SCORE_LABELS.FAIR.threshold) return SCORE_LABELS.FAIR;
    if (score >= SCORE_LABELS.POOR.threshold) return SCORE_LABELS.POOR;
    return SCORE_LABELS.BAD;
}

function generateScoreExplanation(score, details) {
    const { label } = getScoreLabel(score);
    if (score >= SCORE_LABELS.EXCELLENT.threshold) {
        return `Expédition optimale ! ${details.positives.join(', ') || 'Excellent équilibre risque/récompense.'}`;
    }
    if (score >= SCORE_LABELS.GOOD.threshold) {
        const warning = details.issues.length ? ` Attention : ${details.issues[0].toLowerCase()}.` : '';
        return `Bon choix. ${(details.positives[0] || 'Équilibre correct.')} ${warning}`.trim();
    }
    if (score >= SCORE_LABELS.FAIR.threshold) {
        const issues = details.issues.length ? details.issues.join(', ') : 'Ratio risque/récompense moyen';
        return `Acceptable mais perfectible. ${issues}.`;
    }
    if (score >= SCORE_LABELS.POOR.threshold) {
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
