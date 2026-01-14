// analyzer.js - Logique de l'analyseur d'expédition
import { getPetById } from './state.js';
import { EXPEDITION_CONSTANTS, RARITY_NAMES } from './constants.js';
import { formatDuration, calculateLinearScore, escapeHTML } from './utils.js';
import {
    calculateEffectiveRisk,
    calculateSpeedDurationModifier,
    calculateRewards,
    calculateTalismanDropChance,
    calculateProfitabilityScore,
    calculateExpectedTokens,
    formatScoreDisplay,
    formatScoreExpandedFromScore,
    calculateRewardIndex
} from './calculations.js';

const ANALYZER_RANGES = {
    // 8 catégories de risque officielles Crownicles (Lang/fr/commands.json)
    risk: {
        trivial: { min: 0, max: 10, name: 'Tranquille', emoji: '🌿' },
        veryLow: { min: 11, max: 20, name: 'Serein', emoji: '☀️' },
        low: { min: 21, max: 32, name: 'Hasardeux', emoji: '🌤️' },
        moderate: { min: 33, max: 45, name: 'Risqué', emoji: '⚡' },
        high: { min: 46, max: 58, name: 'Dangereux', emoji: '🔥' },
        veryHigh: { min: 59, max: 72, name: 'Périlleux', emoji: '⚠️' },
        extreme: { min: 73, max: 86, name: 'Mortel', emoji: '💀' },
        desperate: { min: 87, max: 100, name: 'Désespéré', emoji: '⚰️' }
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
    const lovePoints = Math.max(20, Math.min(110, parseInt(document.getElementById('analyzerLovePoints').value, 10)));

    const riskKey = document.getElementById('analyzerRisk').value;
    const difficultyKey = document.getElementById('analyzerDifficulty').value;
    const rewardKey = document.getElementById('analyzerReward').value;
    const foodIndex = Math.max(0, Math.min(9, parseInt(document.getElementById('analyzerFood').value, 10)));
    const durationStr = document.getElementById('analyzerDuration').value;
    const location = document.getElementById('analyzerSelectedExpeditionType').value || 'plains';
    const hasTalismanBonus = document.getElementById('analyzerTalismanBonus').checked;
    const hasTokenBonus = document.getElementById('analyzerTokenBonus').checked;

    const riskRange = ANALYZER_RANGES.risk[riskKey];
    const difficultyRange = ANALYZER_RANGES.difficulty[difficultyKey];
    const rewardRange = ANALYZER_RANGES.reward[rewardKey];
    const durationMinutes = parseDuration(durationStr);
    const locationWeights = EXPEDITION_CONSTANTS.LOCATION_REWARD_WEIGHTS[location] || EXPEDITION_CONSTANTS.LOCATION_REWARD_WEIGHTS.plains;
    const rewardIndex = foodIndex;

    const parameterDiv = document.getElementById('parameterRanges');
    if (parameterDiv) {
        parameterDiv.innerHTML = `
            <div class="analyzer-grid">
                ${pet ? `
                <div class="range-display">
                    <div class="label">🐾 Familier</div>
                    <div class="values">${escapeHTML(pet.name)}</div>
                    <div style="font-size: 0.85em; color: var(--text-secondary);">
                        Force: ${String(pet.force)} | Vitesse: ${String(pet.speed)} | Amour: ${lovePoints}
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

    const scenariosDiv = document.getElementById('analyzerScenarios');
    const scoreDiv = document.getElementById('analyzerProfitabilityScore');
    const scoreAvgDiv = document.getElementById('analyzerProfitabilityScoreAvg');

    if (pet) {
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

        // Calcul selon Crownicles: 2 rolls successifs avec effectiveRisk%
        // 1. Roll échec total (effectiveRisk%)
        // 2. Si pas échec, roll succès partiel (effectiveRisk%)
        const calcRates = (effectiveRisk) => {
            const riskRatio = Math.min(100, Math.max(0, effectiveRisk)) / 100;
            const failureRate = riskRatio * 100; // P(échec) = R
            const partialSuccessRate = (1 - riskRatio) * riskRatio * 100; // P(partiel) = (1-R) × R
            const totalSuccessRate = Math.pow(1 - riskRatio, 2) * 100; // P(total) = (1-R)²
            return { totalSuccessRate, partialSuccessRate, failureRate };
        };

        const bestCase = calcRates(minEffectiveRisk);
        const worstCase = calcRates(maxEffectiveRisk);
        const avgCase = calcRates(avgEffectiveRisk);

        const speedModifier = calculateSpeedDurationModifier(pet.speed);
        const effectiveDuration = Math.round(durationMinutes * speedModifier);

        // Afficher les scénarios
        if (scenariosDiv) {
            scenariosDiv.innerHTML = `
                <div style="margin-bottom: 15px; padding: 12px; background: var(--bg-tertiary); border-radius: 8px;">
                    <p><strong>🚀 Durée effective :</strong> ${formatDuration(effectiveDuration)}
                       <span style="color: var(--text-secondary);">(vitesse ${escapeHTML(String(pet.speed))} → ×${speedModifier.toFixed(2)})</span>
                    </p>
                </div>
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
        }

        const exactRewards = {
            points: Math.round(EXPEDITION_CONSTANTS.REWARD_TABLES.POINTS[rewardIndex] * locationWeights.points),
            experience: Math.round(EXPEDITION_CONSTANTS.REWARD_TABLES.EXPERIENCE[rewardIndex] * locationWeights.experience),
            money: Math.round(EXPEDITION_CONSTANTS.REWARD_TABLES.MONEY[rewardIndex] * locationWeights.money),
            tokens: calculateExpectedTokens(rewardIndex, durationMinutes, hasTokenBonus).expected
        };

        const talismanChance = hasTalismanBonus
            ? calculateTalismanDropChance(rewardIndex, true)
            : calculateTalismanDropChance(rewardIndex, false);

        const bestScore = calculateProfitabilityScore(rewardIndex, bestCase.totalSuccessRate, bestCase.partialSuccessRate, bestCase.failureRate, effectiveDuration, exactRewards, talismanChance, hasTalismanBonus, hasTokenBonus);
        const avgScore = calculateProfitabilityScore(rewardIndex, avgCase.totalSuccessRate, avgCase.partialSuccessRate, avgCase.failureRate, effectiveDuration, exactRewards, talismanChance, hasTalismanBonus, hasTokenBonus);
        const worstScore = calculateProfitabilityScore(rewardIndex, worstCase.totalSuccessRate, worstCase.partialSuccessRate, worstCase.failureRate, effectiveDuration, exactRewards, talismanChance, hasTalismanBonus, hasTokenBonus);

        // Score moyen dans l'aperçu avec graphique étendu (comme le simulateur)
        if (scoreAvgDiv) {
            scoreAvgDiv.innerHTML = formatScoreExpandedFromScore(avgScore);
        }

        // Tous les scores par scénario
        if (scoreDiv) {
            scoreDiv.innerHTML = `
                <div class="scenarios-scores-grid">
                    <div class="scenario-score-item best">
                        <span class="scenario-label">🌟 Meilleur cas</span>
                        ${formatScoreDisplay(bestScore, false)}
                    </div>
                    <div class="scenario-score-item average">
                        <span class="scenario-label">📊 Cas moyen</span>
                        ${formatScoreDisplay(avgScore, false)}
                    </div>
                    <div class="scenario-score-item worst">
                        <span class="scenario-label">💀 Pire cas</span>
                        ${formatScoreDisplay(worstScore, false)}
                    </div>
                </div>
            `;
        }
        
        // Mettre à jour les barres de progression avec le cas moyen
        const progressSuccess = document.getElementById('analyzerProgressSuccess');
        const progressPartial = document.getElementById('analyzerProgressPartial');
        const progressFailure = document.getElementById('analyzerProgressFailure');
        
        if (progressSuccess) progressSuccess.style.width = `${avgCase.totalSuccessRate}%`;
        if (progressPartial) progressPartial.style.width = `${avgCase.partialSuccessRate}%`;
        if (progressFailure) progressFailure.style.width = `${avgCase.failureRate}%`;
        
        // Mettre à jour la légende
        const legendSuccess = document.getElementById('analyzerLegendSuccess');
        const legendPartial = document.getElementById('analyzerLegendPartial');
        const legendFailure = document.getElementById('analyzerLegendFailure');
        
        if (legendSuccess) legendSuccess.textContent = avgCase.totalSuccessRate.toFixed(1);
        if (legendPartial) legendPartial.textContent = avgCase.partialSuccessRate.toFixed(1);
        if (legendFailure) legendFailure.textContent = avgCase.failureRate.toFixed(1);
        
        // Mettre à jour le quick summary
        const quickSummary = document.getElementById('analyzerQuickSummary');
        if (quickSummary) {
            const rating = avgCase.totalSuccessRate >= 70 ? '✅ Favorable' : avgCase.totalSuccessRate >= 40 ? '⚠️ Risqué' : '❌ Dangereux';
            quickSummary.innerHTML = `
                <span class="summary-item"><strong>🐾</strong> ${escapeHTML(pet.name)}</span>
                <span class="summary-item"><strong>🎲</strong> ${avgCase.totalSuccessRate.toFixed(0)}% succès</span>
                <span class="summary-item"><strong>📊</strong> ${rating}</span>
            `;
        }
        
        // Mettre à jour la pénalité d'annulation selon les points d'amour
        const cancelLoveChange = document.getElementById('analyzerCancelLoveChange');
        if (cancelLoveChange) {
            const cancelPenalty = lovePoints > 80 ? Math.floor((lovePoints - 80) / 2) + 15 : 15;
            cancelLoveChange.textContent = `-${cancelPenalty}`;
        }
        
        // Mettre à jour le score display compact dans le header
        const headerScoreDisplay = document.getElementById('analyzerScoreDisplay');
        if (headerScoreDisplay) {
            const scorePercent = Math.round(avgScore.score * 100);
            const scoreClass = avgScore.score >= 0.8 ? 'excellent' : avgScore.score >= 0.6 ? 'good' : avgScore.score >= 0.4 ? 'average' : 'poor';
            const scoreLabel = avgScore.score >= 0.8 ? '🌟 Excellente' : avgScore.score >= 0.6 ? '✅ Bonne' : avgScore.score >= 0.4 ? '👍 Correcte' : avgScore.score >= 0.2 ? '⚠️ Médiocre' : '❌ À éviter';
            headerScoreDisplay.innerHTML = `
                <div class="score-badge ${scoreClass}">
                    <span class="score-value">${scorePercent}</span>
                    <span class="score-label">/100</span>
                </div>
                <div class="score-rating">${scoreLabel}</div>
            `;
        }
    } else {
        // Pas de pet sélectionné
        const warningBlock = `
            <div style="padding: 20px; text-align: center; color: var(--warning); background: rgba(251, 191, 36, 0.1); border-radius: 8px;">
                <p style="font-size: 1.1em;">⚠️ Sélectionnez un familier pour voir les probabilités</p>
                <p style="margin-top: 8px; color: var(--text-secondary);">Les probabilités dépendent de la force du pet et des points d'amour.</p>
            </div>
        `;
        if (scenariosDiv) scenariosDiv.innerHTML = warningBlock;
        if (scoreDiv) scoreDiv.innerHTML = warningBlock;
        if (scoreAvgDiv) scoreAvgDiv.innerHTML = warningBlock;
        
        // Réinitialiser les barres de progression
        const progressSuccess = document.getElementById('analyzerProgressSuccess');
        const progressPartial = document.getElementById('analyzerProgressPartial');
        const progressFailure = document.getElementById('analyzerProgressFailure');
        
        if (progressSuccess) progressSuccess.style.width = '33%';
        if (progressPartial) progressPartial.style.width = '33%';
        if (progressFailure) progressFailure.style.width = '34%';
        
        const legendSuccess = document.getElementById('analyzerLegendSuccess');
        const legendPartial = document.getElementById('analyzerLegendPartial');
        const legendFailure = document.getElementById('analyzerLegendFailure');
        
        if (legendSuccess) legendSuccess.textContent = '?';
        if (legendPartial) legendPartial.textContent = '?';
        if (legendFailure) legendFailure.textContent = '?';
        
        const quickSummary = document.getElementById('analyzerQuickSummary');
        if (quickSummary) {
            quickSummary.innerHTML = `<span class="summary-item" style="color: var(--warning);">⚠️ Sélectionnez un familier</span>`;
        }
        
        const headerScoreDisplay = document.getElementById('analyzerScoreDisplay');
        if (headerScoreDisplay) {
            headerScoreDisplay.innerHTML = `<div class="score-badge"><span class="score-value">?</span></div>`;
        }
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
        const expectedTokens = calculateExpectedTokens(rewardIndex, durationMinutes, hasTokenBonus);

        const formatMultiplierBadge = (mult) => {
            const color = mult > 1 ? '#22c55e' : mult < 1 ? '#ef4444' : '#eab308';
            return `<span style="background: ${color}; color: white; padding: 2px 6px; border-radius: 4px; font-size: 0.75em; margin-left: 6px; font-weight: bold;">×${mult.toFixed(1)}</span>`;
        };

        const tokenBonusBadge = hasTokenBonus 
            ? '<span style="background: #8b5cf6; color: white; padding: 2px 6px; border-radius: 4px; font-size: 0.75em; margin-left: 6px; font-weight: bold;">×3</span>' 
            : '';

        rewardDiv.innerHTML = `
            <!-- Table des récompenses par issue -->
            <div class="table-responsive">
                <table class="result-table modern">
                    <thead>
                        <tr>
                            <th>Récompense</th>
                            <th class="success-col">✅ Succès total</th>
                            <th class="partial-col">⚠️ Partiel (×0.5)</th>
                            <th class="failure-col">❌ Échec</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td>🪙 Tokens ${tokenBonusBadge}</td>
                            <td class="multiplier-cell mult-full">${expectedTokens.min}-${expectedTokens.max}</td>
                            <td class="multiplier-cell mult-partial">${Math.ceil(expectedTokens.min / 2)}-${Math.ceil(expectedTokens.max / 2)}</td>
                            <td class="multiplier-cell mult-none">0</td>
                        </tr>
                        <tr>
                            <td>🏅 Points ${formatMultiplierBadge(locationWeights.points)}</td>
                            <td class="multiplier-cell mult-full">${exactRewards.points}</td>
                            <td class="multiplier-cell mult-partial">${Math.round(exactRewards.points / 2)}</td>
                            <td class="multiplier-cell mult-none">0</td>
                        </tr>
                        <tr>
                            <td>⭐ Expérience ${formatMultiplierBadge(locationWeights.experience)}</td>
                            <td class="multiplier-cell mult-full">${exactRewards.experience}</td>
                            <td class="multiplier-cell mult-partial">${Math.round(exactRewards.experience / 2)}</td>
                            <td class="multiplier-cell mult-none">0</td>
                        </tr>
                        <tr>
                            <td>💰 Argent ${formatMultiplierBadge(locationWeights.money)}</td>
                            <td class="multiplier-cell mult-full">${exactRewards.money}</td>
                            <td class="multiplier-cell mult-partial">${Math.round(exactRewards.money / 2)}</td>
                            <td class="multiplier-cell mult-none">0</td>
                        </tr>
                    </tbody>
                </table>
            </div>
            
            <div class="rewards-grid" style="margin-top: 16px;">
                ${renderRarityCard(rewardIndex)}
                ${renderTalismanCard(rewardIndex, hasTalismanBonus)}
            </div>
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
