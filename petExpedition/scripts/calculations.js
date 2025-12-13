// calculations.js - Fonctions de calcul et scoring
import { EXPEDITION_CONSTANTS } from './constants.js';
import { calculateLinearScore, getCategoryName } from './utils.js';

// Constantes pour le calcul du score de rentabilité
// Le score mesure la RENTABILITÉ GLOBALE de l'expédition
// Une expé avec bon taux de succès et récompenses décentes = rentable
// Les bonus (talisman, tokens) AUGMENTENT le score mais ne le dominent pas
const SCORE_WEIGHTS = {
    // Base de rentabilité (70% du score)
    SUCCESS: 0.35,         // Taux de succès = fondamental
    REWARDS: 0.35,         // Index de récompense = fondamental
    // Bonus additionnels (30% du score)
    TALISMAN: 0.15,        // Bonus si chance de talisman
    TOKENS: 0.10,          // Bonus si tokens significatifs
    TIME_EFFICIENCY: 0.05  // Efficacité temps
};

const SCORE_THRESHOLDS = {
    HIGH_REWARD_INDEX: 7,
    LOW_REWARD_INDEX: 2,
    EXCELLENT_SUCCESS_RATE: 90,
    POOR_SUCCESS_RATE: 50,
    VERY_LONG_DURATION: 2880,
    SHORT_DURATION: 60,
    SHORT_DURATION_MIN_REWARD: 3,
    HIGH_TALISMAN_CHANCE: 15,
    NOTABLE_TALISMAN_CHANCE: 5,
    VERY_SAFE_SUCCESS_RATE: 95,
    SAFE_SUCCESS_RATE: 85,
    HIGH_FAILURE_RATE: 40,
    CRITICAL_FAILURE_RATE: 60,
    SWEET_SPOT_MIN_INDEX: 4,
    SWEET_SPOT_MAX_INDEX: 7,
    SWEET_SPOT_MIN_SUCCESS: 70,
    // Seuils pour tokens
    HIGH_TOKENS: 6,
    LOW_TOKENS: 2
};

const SCORE_BONUSES = {
    VERY_SAFE: 0.05,
    SAFE: 0.02,
    SWEET_SPOT: 0.05,                // Augmenté de 3% à 5%
    VERY_SHORT_EFFICIENT: 0.08,      // Bonus pour expé très courte (<15min) avec bon index
    SHORT_EFFICIENT: 0.05,           // Bonus pour expé courte (<60min) avec bon index
    TALISMAN_BONUS_MULTIPLIER: 2.0,
    TOKEN_BONUS_MULTIPLIER: 1.5,
    MAX_TALISMAN_SCORE: 0.30
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

export function calculateRewards(rewardIndex, locationType, durationMinutes = null, hasTokenBonus = false) {
    const weights = EXPEDITION_CONSTANTS.LOCATION_REWARD_WEIGHTS[locationType];
    const tokensConfig = EXPEDITION_CONSTANTS.TOKENS.EXPEDITION;
    const bonusTokensConfig = EXPEDITION_CONSTANTS.BONUS_TOKENS;
    
    // Calcul des tokens basé sur rewardIndex avec offset
    let baseTokens = Math.max(0, rewardIndex + tokensConfig.REWARD_INDEX_OFFSET);
    
    // Malus si durée < 1h
    if (durationMinutes !== null && durationMinutes < tokensConfig.SHORT_DURATION_THRESHOLD_MINUTES) {
        baseTokens = Math.max(0, baseTokens - tokensConfig.SHORT_DURATION_MALUS);
    }
    
    // Malus si rewardIndex = 0
    if (rewardIndex === 0) {
        baseTokens = Math.max(0, baseTokens - tokensConfig.LOW_REWARD_INDEX_MALUS);
    }
    
    // Minimum garanti
    let tokens = Math.max(bonusTokensConfig.MIN_TOKEN_REWARD, baseTokens);
    
    // Bonus multiplicateur x3 si expédition bonus tokens
    if (hasTokenBonus) {
        tokens = Math.max(bonusTokensConfig.MIN_BONUS_TOKEN_REWARD, tokens * bonusTokensConfig.MULTIPLIER);
    }
    
    // Boost aléatoire moyen (pour estimation)
    const avgRandomBoost = (bonusTokensConfig.RANDOM_BOOST_MIN + bonusTokensConfig.RANDOM_BOOST_MAX) / 2;
    tokens += avgRandomBoost;
    
    // Application du poids de localisation
    tokens = Math.round(tokens * (weights.tokens || 1));
    
    return {
        money: Math.round(EXPEDITION_CONSTANTS.REWARD_TABLES.MONEY[rewardIndex] * weights.money),
        experience: Math.round(EXPEDITION_CONSTANTS.REWARD_TABLES.EXPERIENCE[rewardIndex] * weights.experience),
        points: Math.round(EXPEDITION_CONSTANTS.REWARD_TABLES.POINTS[rewardIndex] * weights.points),
        tokens: tokens
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

/**
 * Calcule le nombre de tokens attendus pour une expédition
 * @param {number} rewardIndex - Index de récompense (0-9)
 * @param {number} durationMinutes - Durée de l'expédition en minutes
 * @param {boolean} hasTokenBonus - Si l'expédition a le bonus tokens x3
 * @returns {object} { min, max, expected } - Tokens attendus
 */
export function calculateExpectedTokens(rewardIndex, durationMinutes, hasTokenBonus = false) {
    const tokensConfig = EXPEDITION_CONSTANTS.TOKENS.EXPEDITION;
    const bonusConfig = EXPEDITION_CONSTANTS.BONUS_TOKENS;
    
    // Base: rewardIndex avec offset
    let baseTokens = Math.max(0, rewardIndex + tokensConfig.REWARD_INDEX_OFFSET);
    
    // Malus durée courte (< 1h)
    if (durationMinutes < tokensConfig.SHORT_DURATION_THRESHOLD_MINUTES) {
        baseTokens = Math.max(0, baseTokens - tokensConfig.SHORT_DURATION_MALUS);
    }
    
    // Malus rewardIndex 0
    if (rewardIndex === 0) {
        baseTokens = Math.max(0, baseTokens - tokensConfig.LOW_REWARD_INDEX_MALUS);
    }
    
    // Minimum garanti
    const minGuaranteed = hasTokenBonus ? bonusConfig.MIN_BONUS_TOKEN_REWARD : bonusConfig.MIN_TOKEN_REWARD;
    let tokens = Math.max(minGuaranteed, baseTokens);
    
    // Multiplicateur bonus
    if (hasTokenBonus) {
        tokens *= bonusConfig.MULTIPLIER;
    }
    
    return {
        min: tokens + bonusConfig.RANDOM_BOOST_MIN,
        max: tokens + bonusConfig.RANDOM_BOOST_MAX,
        expected: tokens + (bonusConfig.RANDOM_BOOST_MIN + bonusConfig.RANDOM_BOOST_MAX) / 2,
        hasBonus: hasTokenBonus
    };
}

export function calculateProfitabilityScore(
    rewardIndex,
    totalSuccessRate,
    partialSuccessRate,
    failureRate,
    effectiveDuration,
    rewards,
    talismanChance = 0,
    hasTalismanBonus = false,
    hasTokenBonus = false,
    hasCloneTalisman = false
) {
    const details = {
        successScore: 0,
        rewardScore: 0,
        talismanScore: 0,
        tokenScore: 0,
        timeEfficiency: 0,
        safetyBonus: 0,
        sweetSpotBonus: 0,
        failurePenalty: 0,
        issues: [],
        positives: []
    };

    // ========== 1. TAUX DE SUCCÈS (35% - fondamental) ==========
    // Succès total = 100% de valeur, partiel = 50%
    const effectiveSuccessRate = totalSuccessRate + (partialSuccessRate * 0.5);
    details.successScore = effectiveSuccessRate / 100;
    
    if (totalSuccessRate >= SCORE_THRESHOLDS.EXCELLENT_SUCCESS_RATE) {
        details.positives.push('Succès quasi-garanti');
    } else if (totalSuccessRate < SCORE_THRESHOLDS.POOR_SUCCESS_RATE) {
        details.issues.push('Risque d\'échec élevé');
    }

    // ========== 2. INDEX DE RÉCOMPENSE (35% - fondamental) ==========
    // Index 0-9, normalisé. Index 3 = 33%, Index 5 = 55%, etc.
    details.rewardScore = (rewardIndex + 1) / 10;
    
    if (rewardIndex >= SCORE_THRESHOLDS.HIGH_REWARD_INDEX) {
        details.positives.push('Récompenses élevées');
    } else if (rewardIndex <= SCORE_THRESHOLDS.LOW_REWARD_INDEX) {
        details.issues.push('Récompenses faibles');
    }

    // ========== 3. BONUS TALISMAN (15% - bonus additionnel) ==========
    if (!hasCloneTalisman && talismanChance > 0) {
        const effectiveTalismanChance = (talismanChance * totalSuccessRate) / 100;
        // Normaliser: 10% de chance effective = score max
        details.talismanScore = Math.min(1, effectiveTalismanChance / 10);
        
        if (hasTalismanBonus) {
            details.talismanScore = Math.min(1, details.talismanScore * 2);
            details.positives.push('🧬 Bonus talisman ×10 actif !');
        }
        
        if (effectiveTalismanChance >= SCORE_THRESHOLDS.HIGH_TALISMAN_CHANCE) {
            details.positives.push(`Bonne chance talisman (${effectiveTalismanChance.toFixed(1)}%)`);
        }
    }

    // ========== 4. BONUS TOKENS (10% - bonus additionnel) ==========
    const tokenValue = rewards.tokens || 0;
    // Normaliser: 8 tokens = score max
    details.tokenScore = Math.min(1, tokenValue / 8);
    
    if (hasTokenBonus) {
        details.tokenScore = Math.min(1, details.tokenScore * 1.5);
        details.positives.push('🪙 Bonus tokens ×3 actif !');
    }
    
    if (tokenValue >= SCORE_THRESHOLDS.HIGH_TOKENS) {
        details.positives.push(`${tokenValue} tokens estimés`);
    }

    // ========== 5. EFFICACITÉ TEMPS (5%) ==========
    // Meilleur ratio = récompenses élevées pour temps court
    const rewardPerHour = (rewardIndex + 1) / (effectiveDuration / 60);
    const maxRewardPerHour = 10 / 0.5; // Index 9 en 30 min
    details.timeEfficiency = Math.min(1, rewardPerHour / maxRewardPerHour);
    
    if (effectiveDuration > SCORE_THRESHOLDS.VERY_LONG_DURATION) {
        details.issues.push('Expédition très longue');
    }
    // Note: le message "Bon ratio" est ajouté dans la section bonus ci-dessous

    // ========== CALCUL DU SCORE FINAL ==========
    let baseScore = 
        (details.successScore * SCORE_WEIGHTS.SUCCESS) +
        (details.rewardScore * SCORE_WEIGHTS.REWARDS) +
        (details.talismanScore * SCORE_WEIGHTS.TALISMAN) +
        (details.tokenScore * SCORE_WEIGHTS.TOKENS) +
        (details.timeEfficiency * SCORE_WEIGHTS.TIME_EFFICIENCY);

    // ========== BONUS/MALUS ==========
    details.safetyBonus = totalSuccessRate > SCORE_THRESHOLDS.VERY_SAFE_SUCCESS_RATE 
        ? SCORE_BONUSES.VERY_SAFE 
        : (totalSuccessRate > SCORE_THRESHOLDS.SAFE_SUCCESS_RATE ? SCORE_BONUSES.SAFE : 0);
    
    details.failurePenalty = failureRate > SCORE_THRESHOLDS.HIGH_FAILURE_RATE 
        ? (failureRate - SCORE_THRESHOLDS.HIGH_FAILURE_RATE) / 200 
        : 0;
    
    // Zone optimale (index 4-7 avec bon succès)
    const isInSweetSpot = rewardIndex >= SCORE_THRESHOLDS.SWEET_SPOT_MIN_INDEX 
        && rewardIndex <= SCORE_THRESHOLDS.SWEET_SPOT_MAX_INDEX 
        && totalSuccessRate > SCORE_THRESHOLDS.SWEET_SPOT_MIN_SUCCESS;
    details.sweetSpotBonus = isInSweetSpot ? SCORE_BONUSES.SWEET_SPOT : 0;

    // Bonus efficacité temps : expé courte avec bon index = très rentable
    details.timeBonus = 0;
    if (rewardIndex >= 3 && totalSuccessRate > 70) {
        if (effectiveDuration <= 15) {
            // Très courte (<15min) avec index 3+ = excellent
            details.timeBonus = SCORE_BONUSES.VERY_SHORT_EFFICIENT;
            details.positives.push('⚡ Très efficace (courte durée, bonnes récompenses)');
        } else if (effectiveDuration <= 60) {
            // Courte (<1h) avec index 3+ = bon
            details.timeBonus = SCORE_BONUSES.SHORT_EFFICIENT;
            details.positives.push('Bon ratio temps/récompense');
        }
    }

    if (details.sweetSpotBonus > 0) {
        details.positives.push(`Zone optimale (index ${rewardIndex})`);
    }
    if (failureRate > SCORE_THRESHOLDS.CRITICAL_FAILURE_RATE) {
        details.issues.push(`Échec probable (${failureRate.toFixed(0)}%)`);
    }

    const finalScore = Math.max(0, Math.min(1, 
        baseScore + details.safetyBonus + details.sweetSpotBonus + details.timeBonus - details.failurePenalty
    ));

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

export function formatScoreDisplayExpanded(data) {
    const { score, details } = data.profitabilityScore;
    const { label, color, emoji } = getScoreLabel(score);
    const percentage = (score * 100).toFixed(1);

    // Breakdown bars
    const breakdown = [
        { name: 'Succès', value: details.successScore, weight: 35, color: '#22c55e' },
        { name: 'Index', value: details.rewardScore, weight: 35, color: '#3b82f6' },
        { name: 'Talisman', value: details.talismanScore, weight: 15, color: '#8b5cf6' },
        { name: 'Tokens', value: details.tokenScore, weight: 10, color: '#f59e0b' },
        { name: 'Temps', value: details.timeEfficiency, weight: 5, color: '#06b6d4' }
    ];

    const breakdownHTML = breakdown.map(b => `
        <div class="score-breakdown-row">
            <span class="breakdown-label">${b.name} (${b.weight}%)</span>
            <div class="breakdown-bar-container">
                <div class="breakdown-bar" style="width: ${b.value * 100}%; background: ${b.color};"></div>
            </div>
            <span class="breakdown-value">${(b.value * 100).toFixed(0)}%</span>
        </div>
    `).join('');

    return `
        <div class="score-expanded">
            <div class="score-main">
                <div class="score-circle" style="--score: ${percentage}; --color: ${color};">
                    <span class="score-value">${percentage}%</span>
                </div>
                <div class="score-label">
                    <span class="score-emoji">${emoji}</span>
                    <span class="score-text" style="color: ${color};">${label}</span>
                </div>
            </div>
            <div class="score-breakdown">
                ${breakdownHTML}
            </div>
        </div>
    `;
}

// Version pour l'analyseur qui prend un objet score directement
export function formatScoreExpandedFromScore(scoreResult) {
    const { score, details } = scoreResult;
    const { label, color, emoji } = getScoreLabel(score);
    const percentage = (score * 100).toFixed(1);

    // Breakdown bars
    const breakdown = [
        { name: 'Succès', value: details.successScore, weight: 35, color: '#22c55e' },
        { name: 'Index', value: details.rewardScore, weight: 35, color: '#3b82f6' },
        { name: 'Talisman', value: details.talismanScore, weight: 15, color: '#8b5cf6' },
        { name: 'Tokens', value: details.tokenScore, weight: 10, color: '#f59e0b' },
        { name: 'Temps', value: details.timeEfficiency, weight: 5, color: '#06b6d4' }
    ];

    const breakdownHTML = breakdown.map(b => `
        <div class="score-breakdown-row">
            <span class="breakdown-label">${b.name} (${b.weight}%)</span>
            <div class="breakdown-bar-container">
                <div class="breakdown-bar" style="width: ${b.value * 100}%; background: ${b.color};"></div>
            </div>
            <span class="breakdown-value">${(b.value * 100).toFixed(0)}%</span>
        </div>
    `).join('');

    return `
        <div class="score-expanded">
            <div class="score-main">
                <div class="score-circle" style="--score: ${percentage}; --color: ${color};">
                    <span class="score-value">${percentage}%</span>
                </div>
                <div class="score-label">
                    <span class="score-emoji">${emoji}</span>
                    <span class="score-text" style="color: ${color};">${label}</span>
                </div>
            </div>
            <div class="score-breakdown">
                ${breakdownHTML}
            </div>
        </div>
    `;
}

export function formatRiskAnalysis(data) {
    const { riskRate, effectiveRisk, hasEnoughFood, difficulty, totalSuccessRate, partialSuccessRate, failureRate, lovePoints } = data;
    
    const riskFactors = [];
    const warnings = [];
    const tips = [];

    // Analyze risk factors
    if (!hasEnoughFood) {
        warnings.push({
            icon: '🍖',
            title: 'Rations insuffisantes',
            desc: 'Le risque est multiplié par 3 ! Assurez-vous d\'avoir assez de nourriture.',
            severity: 'critical'
        });
    }

    if (riskRate >= 30) {
        riskFactors.push({
            icon: '⚠️',
            title: `Dangerosité élevée (${riskRate}%)`,
            desc: getCategoryName(riskRate, EXPEDITION_CONSTANTS.RISK_CATEGORIES),
            severity: 'high'
        });
    } else if (riskRate >= 15) {
        riskFactors.push({
            icon: '⚡',
            title: `Dangerosité modérée (${riskRate}%)`,
            desc: getCategoryName(riskRate, EXPEDITION_CONSTANTS.RISK_CATEGORIES),
            severity: 'medium'
        });
    }

    if (difficulty >= 7) {
        riskFactors.push({
            icon: '🎯',
            title: `Difficulté extrême (${difficulty})`,
            desc: getCategoryName(difficulty, EXPEDITION_CONSTANTS.DIFFICULTY_CATEGORIES),
            severity: 'high'
        });
    } else if (difficulty >= 5) {
        riskFactors.push({
            icon: '🎯',
            title: `Difficulté élevée (${difficulty})`,
            desc: getCategoryName(difficulty, EXPEDITION_CONSTANTS.DIFFICULTY_CATEGORIES),
            severity: 'medium'
        });
    }

    // Tips based on situation
    if (failureRate > 30) {
        tips.push('Considérez un familier avec plus de force pour réduire le risque.');
    }
    if (lovePoints < 90 && totalSuccessRate < 80) {
        tips.push('Augmenter les points d\'amour améliorerait les chances de succès.');
    }
    if (totalSuccessRate >= 90) {
        tips.push('Excellentes chances de succès ! Cette expédition est sûre.');
    }

    // Generate HTML
    let html = '';

    // Summary meters
    html += `
        <div class="risk-meters">
            <div class="risk-meter">
                <span class="meter-label">Risque initial</span>
                <div class="meter-bar">
                    <div class="meter-fill ${getRiskSeverityClass(riskRate)}" style="width: ${riskRate}%;"></div>
                </div>
                <span class="meter-value">${riskRate}%</span>
            </div>
            <div class="risk-meter">
                <span class="meter-label">Risque effectif</span>
                <div class="meter-bar">
                    <div class="meter-fill ${getRiskSeverityClass(effectiveRisk)}" style="width: ${Math.min(100, effectiveRisk)}%;"></div>
                </div>
                <span class="meter-value">${effectiveRisk.toFixed(1)}%</span>
            </div>
        </div>
    `;

    // Warnings
    if (warnings.length > 0) {
        html += '<div class="risk-warnings">';
        warnings.forEach(w => {
            html += `
                <div class="risk-warning ${w.severity}">
                    <span class="warning-icon">${w.icon}</span>
                    <div class="warning-content">
                        <strong>${w.title}</strong>
                        <p>${w.desc}</p>
                    </div>
                </div>
            `;
        });
        html += '</div>';
    }

    // Risk factors
    if (riskFactors.length > 0) {
        html += '<div class="risk-factors">';
        riskFactors.forEach(f => {
            html += `
                <div class="risk-factor ${f.severity}">
                    <span class="factor-icon">${f.icon}</span>
                    <div class="factor-content">
                        <strong>${f.title}</strong>
                        <span>${f.desc}</span>
                    </div>
                </div>
            `;
        });
        html += '</div>';
    }

    // Tips
    if (tips.length > 0) {
        html += '<div class="risk-tips">';
        html += '<h4>💡 Conseils</h4>';
        html += '<ul>';
        tips.forEach(tip => {
            html += `<li>${tip}</li>`;
        });
        html += '</ul>';
        html += '</div>';
    }

    // If no issues
    if (warnings.length === 0 && riskFactors.length === 0) {
        html += `
            <div class="risk-safe">
                <span class="safe-icon">✅</span>
                <p>Cette expédition présente un risque maîtrisé. Bonne chance !</p>
            </div>
        `;
    }

    return html;
}

function getRiskSeverityClass(risk) {
    if (risk >= 50) return 'severity-critical';
    if (risk >= 30) return 'severity-high';
    if (risk >= 15) return 'severity-medium';
    return 'severity-low';
}

export function describeRewardCategory(rewardIndex) {
    return getCategoryName(rewardIndex, EXPEDITION_CONSTANTS.REWARD_CATEGORIES);
}
