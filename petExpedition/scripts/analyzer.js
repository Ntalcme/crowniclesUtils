// analyzer.js - Logique de l'analyseur d'expédition
import { getPetById } from './state.js';
import { EXPEDITION_CONSTANTS, RARITY_NAMES } from './constants.js';
import { formatDuration, calculateLinearScore } from './utils.js';
import {
    calculateEffectiveRisk,
    calculateSpeedDurationModifier,
    calculateRewards,
    calculateTalismanDropChance,
    calculateProfitabilityScore,
    formatScoreDisplay,
    calculateRewardIndex
} from './calculations.js';

const ANALYZER_RANGES = {
    risk: {
        veryLow: { min: 0, max: 15, name: 'Paisible' },
        low: { min: 16, max: 30, name: 'Peu risqué' },
        medium: { min: 31, max: 50, name: 'Modéré' },
        high: { min: 51, max: 70, name: 'Dangereux' },
        veryHigh: { min: 71, max: 100, name: 'Périlleux' }
    },
    difficulty: {
        trivial: { min: 0, max: 20, name: 'Aisé' },
        easy: { min: 21, max: 40, name: 'Accessible' },
        moderate: { min: 41, max: 60, name: 'Exigeant' },
        challenging: { min: 61, max: 80, name: 'Ardu' },
        treacherous: { min: 81, max: 100, name: 'Impitoyable' }
    },
    reward: {
        meager: { min: 0, max: 1, name: 'Maigres' },
        modest: { min: 2, max: 3, name: 'Modestes' },
        substantial: { min: 4, max: 5, name: 'Correctes' },
        bountiful: { min: 6, max: 7, name: 'Abondantes' },
        legendary: { min: 8, max: 9, name: 'Exceptionnelles' }
    }
};

function parseDuration(durationStr) {
    const str = durationStr.toLowerCase().trim();
    let totalMinutes = 0;

    const daysMatch = str.match(/(\d+)\s*j/);
    if (daysMatch) totalMinutes += parseInt(daysMatch[1], 10) * 24 * 60;

    const hoursMatch = str.match(/(\d+)\s*h/);
    if (hoursMatch) totalMinutes += parseInt(hoursMatch[1], 10) * 60;

    const minsMatch = str.match(/(\d+)\s*min/);
    if (minsMatch) totalMinutes += parseInt(minsMatch[1], 10);

    if (totalMinutes === 0 && /^\d+$/.test(str)) {
        totalMinutes = parseInt(str, 10);
    }

    return Math.max(10, Math.min(4320, totalMinutes || 120));
}

export function analyzeExpedition() {
    const petId = parseInt(document.getElementById('analyzerSelectedPetId').value, 10);
    const pet = getPetById(petId);
    const lovePoints = parseInt(document.getElementById('analyzerLovePoints').value, 10);

    const riskKey = document.getElementById('analyzerRisk').value;
    const difficultyKey = document.getElementById('analyzerDifficulty').value;
    const rewardKey = document.getElementById('analyzerReward').value;
    const foodIndex = parseInt(document.getElementById('analyzerFood').value, 10);
    const durationStr = document.getElementById('analyzerDuration').value;
    const location = document.getElementById('analyzerLocation').value;
    const hasTalismanBonus = document.getElementById('analyzerTalismanBonus').checked;

    const riskRange = ANALYZER_RANGES.risk[riskKey];
    const difficultyRange = ANALYZER_RANGES.difficulty[difficultyKey];
    const rewardRange = ANALYZER_RANGES.reward[rewardKey];
    const durationMinutes = parseDuration(durationStr);
    const locationWeights = EXPEDITION_CONSTANTS.LOCATION_REWARD_WEIGHTS[location];
    const rewardIndex = foodIndex;

    const parameterDiv = document.getElementById('parameterRanges');
    if (parameterDiv) {
        parameterDiv.innerHTML = `
            <div class="analyzer-grid">
                ${pet ? `
                <div class="range-display">
                    <div class="label">🐾 Familier</div>
                    <div class="values">${pet.name}</div>
                    <div style="font-size: 0.85em; color: var(--text-secondary);">
                        Force: ${pet.force} | Vitesse: ${pet.speed} | Amour: ${lovePoints}
                    </div>
                </div>
                ` : `
                <div class="range-display">
                    <div class="label">🐾 Familier</div>
                    <div class="values" style="color: var(--warning);">Non sélectionné</div>
                    <div style="font-size: 0.85em; color: var(--text-secondary);">
                        Sélectionnez un pet pour calculer les probabilités
                    </div>
                </div>
                `}
                <div class="range-display">
                    <div class="label">⚠️ Dangerosité</div>
                    <div class="values">${riskRange.min}% - ${riskRange.max}%</div>
                    <div class="range-bar"><div class="range-fill" style="width: ${((riskRange.min + riskRange.max) / 2)}%;"></div></div>
                </div>
                <div class="range-display">
                    <div class="label">🎯 Difficulté</div>
                    <div class="values">${difficultyRange.min} - ${difficultyRange.max}</div>
                    <div class="range-bar"><div class="range-fill" style="width: ${((difficultyRange.min + difficultyRange.max) / 2)}%;"></div></div>
                </div>
                <div class="range-display">
                    <div class="label">⏱️ Durée</div>
                    <div class="values">${formatDuration(durationMinutes)}</div>
                    <div class="range-bar"><div class="range-fill" style="width: ${(durationMinutes / 4320 * 100)}%;"></div></div>
                </div>
                <div class="range-display">
                    <div class="label">🍖 Index rations</div>
                    <div class="values">${foodIndex} (${EXPEDITION_CONSTANTS.FOOD_CONSUMPTION[foodIndex]} rations)</div>
                    <div class="range-bar"><div class="range-fill" style="width: ${((foodIndex + 1) * 10)}%;"></div></div>
                </div>
            </div>
        `;
    }

    const probabilitiesDiv = document.getElementById('successProbabilities');
    const scoreDiv = document.getElementById('analyzerProfitabilityScore');

    if (pet && probabilitiesDiv && scoreDiv) {
        const calcEffectiveRisk = (risk, diff) => calculateEffectiveRisk(
            risk,
            diff,
            pet.force,
            lovePoints
        );

        const minEffectiveRisk = calcEffectiveRisk(riskRange.min, difficultyRange.min);
        const maxEffectiveRisk = calcEffectiveRisk(riskRange.max, difficultyRange.max);
        const avgEffectiveRisk = calcEffectiveRisk(
            (riskRange.min + riskRange.max) / 2,
            (difficultyRange.min + difficultyRange.max) / 2
        );

        const calcRates = (effectiveRisk) => {
            const failureRate = Math.min(100, Math.max(0, effectiveRisk));
            const successRate = 100 - failureRate;
            const partialSuccessRate = (successRate * failureRate) / 100;
            const totalSuccessRate = successRate - partialSuccessRate;
            return { totalSuccessRate, partialSuccessRate, failureRate };
        };

        const bestCase = calcRates(minEffectiveRisk);
        const worstCase = calcRates(maxEffectiveRisk);
        const avgCase = calcRates(avgEffectiveRisk);

        const speedModifier = calculateSpeedDurationModifier(pet.speed);
        const effectiveDuration = Math.round(durationMinutes * speedModifier);

        probabilitiesDiv.innerHTML = `
            <div style="margin-bottom: 20px; padding: 15px; background: var(--bg-tertiary); border-radius: 8px;">
                <p><strong>🚀 Durée effective :</strong> ${formatDuration(effectiveDuration)}
                   <span style="color: var(--text-secondary);">(vitesse ${pet.speed} → ×${speedModifier.toFixed(2)})</span>
                </p>
            </div>
            <h4 style="margin-bottom: 15px;">Scénarios selon les valeurs exactes de risque/difficulté :</h4>
            ${renderScenario('🌟 Meilleur cas', riskRange.min, difficultyRange.min, minEffectiveRisk, bestCase, 'var(--success)')}
            ${renderScenario('📊 Cas moyen', ((riskRange.min + riskRange.max) / 2).toFixed(0), ((difficultyRange.min + difficultyRange.max) / 2).toFixed(0), avgEffectiveRisk, avgCase, 'var(--warning)')}
            ${renderScenario('💀 Pire cas', riskRange.max, difficultyRange.max, maxEffectiveRisk, worstCase, 'var(--danger)')}
            <div style="margin-top: 15px; padding: 12px; background: var(--bg-tertiary); border-radius: 8px; font-size: 0.9em;">
                <strong>📐 Formule du risque effectif :</strong>
                <p style="font-family: monospace; margin-top: 5px;">
                    Risque effectif = Dangerosité + (Difficulté ÷ 3) - Force - (Amour ÷ 10)
                </p>
            </div>
        `;

        const exactRewards = {
            points: Math.round(EXPEDITION_CONSTANTS.REWARD_TABLES.POINTS[rewardIndex] * locationWeights.points),
            experience: Math.round(EXPEDITION_CONSTANTS.REWARD_TABLES.EXPERIENCE[rewardIndex] * locationWeights.experience),
            money: Math.round(EXPEDITION_CONSTANTS.REWARD_TABLES.MONEY[rewardIndex] * locationWeights.money)
        };

        const talismanChance = hasTalismanBonus
            ? calculateTalismanDropChance(rewardIndex, true)
            : calculateTalismanDropChance(rewardIndex, false);

        const bestScore = calculateProfitabilityScore(rewardIndex, bestCase.totalSuccessRate, bestCase.partialSuccessRate, bestCase.failureRate, effectiveDuration, exactRewards, talismanChance, hasTalismanBonus);
        const avgScore = calculateProfitabilityScore(rewardIndex, avgCase.totalSuccessRate, avgCase.partialSuccessRate, avgCase.failureRate, effectiveDuration, exactRewards, talismanChance, hasTalismanBonus);
        const worstScore = calculateProfitabilityScore(rewardIndex, worstCase.totalSuccessRate, worstCase.partialSuccessRate, worstCase.failureRate, effectiveDuration, exactRewards, talismanChance, hasTalismanBonus);

        scoreDiv.innerHTML = `
            <div style="display: grid; gap: 15px;">
                <div><p style="margin-bottom: 8px;"><strong>🌟 Meilleur cas :</strong></p>${formatScoreDisplay(bestScore)}</div>
                <div><p style="margin-bottom: 8px;"><strong>📊 Cas moyen :</strong></p>${formatScoreDisplay(avgScore)}</div>
                <div><p style="margin-bottom: 8px;"><strong>💀 Pire cas :</strong></p>${formatScoreDisplay(worstScore)}</div>
            </div>
        `;
    } else if (probabilitiesDiv && scoreDiv) {
        const warningBlock = `
            <div style="padding: 20px; text-align: center; color: var(--warning); background: rgba(251, 191, 36, 0.1); border-radius: 8px;">
                <p style="font-size: 1.2em;">⚠️ Sélectionnez un familier pour voir les probabilités</p>
                <p style="margin-top: 10px; color: var(--text-secondary);">Les probabilités dépendent de la force du pet et des points d'amour.</p>
            </div>
        `;
        probabilitiesDiv.innerHTML = warningBlock;
        scoreDiv.innerHTML = warningBlock;
    }

    const rewardDiv = document.getElementById('rewardRanges');
    const rewardIndexSpan = document.getElementById('deducedRewardIndex');
    if (rewardIndexSpan) rewardIndexSpan.textContent = rewardIndex;

    if (rewardDiv) {
        const exactRewards = {
            points: Math.round(EXPEDITION_CONSTANTS.REWARD_TABLES.POINTS[rewardIndex] * locationWeights.points),
            experience: Math.round(EXPEDITION_CONSTANTS.REWARD_TABLES.EXPERIENCE[rewardIndex] * locationWeights.experience),
            money: Math.round(EXPEDITION_CONSTANTS.REWARD_TABLES.MONEY[rewardIndex] * locationWeights.money)
        };

        rewardDiv.innerHTML = `
            ${renderRewardsCard('✅ Succès total', exactRewards, locationWeights)}
            ${renderRewardsCard('⚠️ Succès partiel (÷2)', {
                points: Math.round(exactRewards.points / 2),
                experience: Math.round(exactRewards.experience / 2),
                money: Math.round(exactRewards.money / 2)
            }, locationWeights, true)}
            ${renderRarityCard(rewardIndex)}
            ${renderTalismanCard(rewardIndex, hasTalismanBonus)}
        `;
    }

    const consistencyDiv = document.getElementById('consistencyCheck');
    if (consistencyDiv) {
        const durationScore = calculateLinearScore(durationMinutes, EXPEDITION_CONSTANTS.DURATION.MIN_MINUTES, EXPEDITION_CONSTANTS.DURATION.MAX_MINUTES);
        const avgRisk = (riskRange.min + riskRange.max) / 2;
        const avgDifficulty = (difficultyRange.min + difficultyRange.max) / 2;
        const riskScore = calculateLinearScore(avgRisk, 0, 100);
        const diffScore = calculateLinearScore(avgDifficulty, 0, 100);
        const estimatedIndex = Math.round((durationScore * 3) + riskScore + diffScore);
        const clampedEstimated = Math.max(0, Math.min(9, estimatedIndex));
        const isConsistent = rewardIndex >= rewardRange.min && rewardIndex <= rewardRange.max;
        const estimatedConsistent = Math.abs(clampedEstimated - rewardIndex) <= 2;

        consistencyDiv.innerHTML = `
            <div style="display: grid; gap: 15px;">
                <div style="padding: 15px; border-radius: 8px; background: ${isConsistent ? 'rgba(34, 197, 94, 0.1)' : 'rgba(239, 68, 68, 0.1)'}; border: 1px solid ${isConsistent ? 'var(--success)' : 'var(--danger)'};">
                    <strong>${isConsistent ? '✅' : '⚠️'} Cohérence Rations/Récompenses :</strong>
                    <p style="margin-top: 5px;">
                        Index des rations : <strong>${rewardIndex}</strong><br>
                        Catégorie récompenses sélectionnée : <strong>${rewardRange.name}</strong> (index ${rewardRange.min}-${rewardRange.max})
                    </p>
                    ${!isConsistent ? '<p style="margin-top: 10px; color: var(--danger);">Les rations ne correspondent pas à la catégorie de récompenses sélectionnée.</p>' : ''}
                </div>
                <div style="padding: 15px; border-radius: 8px; background: ${estimatedConsistent ? 'rgba(34, 197, 94, 0.1)' : 'rgba(251, 191, 36, 0.1)'}; border: 1px solid ${estimatedConsistent ? 'var(--success)' : 'var(--warning)'};">
                    <strong>${estimatedConsistent ? '✅' : '⚠️'} Estimation basée sur durée/risque/difficulté :</strong>
                    <p style="margin-top: 5px;">
                        Index estimé (wealth=1.0) : <strong>${clampedEstimated}</strong><br>
                        Index réel (rations) : <strong>${rewardIndex}</strong>
                    </p>
                    ${!estimatedConsistent ? '<p style="margin-top: 10px; color: var(--warning);">L\'écart suggère un taux de richesse différent de 1.0.</p>' : ''}
                </div>
                <div style="padding: 15px; border-radius: 8px; background: var(--bg-tertiary);">
                    <strong>📐 Détail du calcul estimé :</strong>
                    <p style="margin-top: 5px; font-family: monospace; font-size: 0.9em;">
                        Score durée : ${durationScore.toFixed(2)} (${formatDuration(durationMinutes)})<br>
                        Score risque : ${riskScore.toFixed(2)} (${avgRisk.toFixed(0)}% moyen)<br>
                        Score difficulté : ${diffScore.toFixed(2)} (${avgDifficulty.toFixed(0)} moyen)<br><br>
                        Index = (${durationScore.toFixed(2)} × 3) + ${riskScore.toFixed(2)} + ${diffScore.toFixed(2)}<br>
                        Index = ${((durationScore * 3) + riskScore + diffScore).toFixed(2)} → arrondi à ${clampedEstimated}
                    </p>
                </div>
            </div>
        `;
    }

    const resultsContainer = document.getElementById('analyzerResults');
    if (resultsContainer) {
        resultsContainer.style.display = 'block';
        resultsContainer.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
}

function renderScenario(title, riskLabel, diffLabel, effectiveRisk, rates, color) {
    return `
        <div style="padding: 15px; border-radius: 8px; background: ${color === 'var(--success)' ? 'rgba(34, 197, 94, 0.1)' : color === 'var(--warning)' ? 'rgba(251, 191, 36, 0.1)' : 'rgba(239, 68, 68, 0.1)'}; border: 1px solid ${color}; margin-bottom: 15px;">
            <strong>${title}</strong>
            <p style="margin-top: 5px; color: var(--text-secondary);">Risque effectif : ${effectiveRisk.toFixed(1)}%</p>
            <div class="progress-bar" style="margin-top: 10px;">
                <div class="progress-success" style="width: ${rates.totalSuccessRate}%; min-width: ${rates.totalSuccessRate > 0 ? '30px' : '0'};">
                    ${rates.totalSuccessRate >= 10 ? `${rates.totalSuccessRate.toFixed(1)}%` : ''}
                </div>
                <div class="progress-partial" style="width: ${rates.partialSuccessRate}%; min-width: ${rates.partialSuccessRate > 5 ? '30px' : '0'};">
                    ${rates.partialSuccessRate >= 10 ? `${rates.partialSuccessRate.toFixed(1)}%` : ''}
                </div>
                <div class="progress-failure" style="width: ${rates.failureRate}%; min-width: ${rates.failureRate > 0 ? '30px' : '0'};">
                    ${rates.failureRate >= 10 ? `${rates.failureRate.toFixed(1)}%` : ''}
                </div>
            </div>
            <div style="display: flex; gap: 15px; margin-top: 8px; font-size: 0.9em;">
                <span>✅ Total: <strong>${rates.totalSuccessRate.toFixed(1)}%</strong></span>
                <span>⚠️ Partiel: <strong>${rates.partialSuccessRate.toFixed(1)}%</strong></span>
                <span>❌ Échec: <strong>${rates.failureRate.toFixed(1)}%</strong></span>
            </div>
        </div>
    `;
}

function renderRewardsCard(title, rewards, locationWeights, isPartial = false) {
    const formatMultiplierBadge = (value) => {
        if (value > 1) return `<span class="multiplier-badge" style="background: var(--success) !important; color: #1a1a2e !important;">×${value}</span>`;
        if (value < 1) return `<span class="multiplier-badge" style="background: var(--danger) !important; color: white !important;">×${value}</span>`;
        return `<span class="multiplier-badge" style="background: var(--warning) !important; color: #1a1a2e !important;">×${value}</span>`;
    };

    return `
        <div class="reward-range-card" style="${isPartial ? 'opacity: 0.8;' : ''}">
            <h4>${title}</h4>
            <div class="reward-range-grid">
                <div class="reward-range-item">
                    <div class="icon">🏅</div>
                    <div class="range">${rewards.points}</div>
                    <div class="label">Points ${formatMultiplierBadge(locationWeights.points)}</div>
                </div>
                <div class="reward-range-item">
                    <div class="icon">⭐</div>
                    <div class="range">${rewards.experience}</div>
                    <div class="label">XP ${formatMultiplierBadge(locationWeights.experience)}</div>
                </div>
                <div class="reward-range-item">
                    <div class="icon">💰</div>
                    <div class="range">${rewards.money}</div>
                    <div class="label">Argent ${formatMultiplierBadge(locationWeights.money)}</div>
                </div>
            </div>
        </div>
    `;
}

function renderRarityCard(rewardIndex) {
    const minRarity = Math.max(1, rewardIndex - 4);
    const maxRarity = EXPEDITION_CONSTANTS.ITEM_REWARD.MAX_RARITY_BY_REWARD_INDEX[rewardIndex];
    let badges = '';
    for (let rarity = minRarity; rarity <= maxRarity; rarity++) {
        badges += `<span class="rarity-badge rarity-${rarity}">${RARITY_NAMES[rarity]}</span>`;
    }
    return `
        <div class="reward-range-card">
            <h4>📦 Rareté d'objet possible</h4>
            <div style="display: flex; gap: 8px; flex-wrap: wrap; margin-top: 10px;">
                ${badges}
            </div>
        </div>
    `;
}

function renderTalismanCard(rewardIndex, hasTalismanBonus) {
    const baseChance = EXPEDITION_CONSTANTS.CLONE_TALISMAN.BASE_DROP_CHANCE + rewardIndex * EXPEDITION_CONSTANTS.CLONE_TALISMAN.REWARD_INDEX_BONUS_PER_POINT;
    const bonusChance = baseChance * EXPEDITION_CONSTANTS.CLONE_TALISMAN.BONUS_EXPEDITION_MULTIPLIER;
    const content = hasTalismanBonus
        ? `<p style="color: var(--success); font-size: 1.2em;"><strong>✨ Chance avec bonus : ${bonusChance.toFixed(1)}%</strong></p>
           <p style="margin-top: 5px; color: var(--text-secondary);">Chance de base (sans bonus) : ${baseChance.toFixed(1)}%</p>`
        : `<p>Chance de base : <strong>${baseChance.toFixed(1)}%</strong></p>
           <p style="margin-top: 5px; color: var(--text-secondary);">Avec bonus ×10 : ${bonusChance.toFixed(1)}%</p>`;

    return `
        <div class="reward-range-card">
            <h4>🧬 Chance de Talisman de clonage ${hasTalismanBonus ? '<span style="color: var(--success);">(BONUS ACTIF ×10)</span>' : ''}</h4>
            <div style="margin-top: 10px;">
                ${content}
                <p style="font-size: 0.85em; color: var(--text-secondary); margin-top: 10px;">
                    Note: Uniquement en cas de succès total, si vous n'avez pas déjà le talisman.
                </p>
            </div>
        </div>
    `;
}
