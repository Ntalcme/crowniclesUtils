// simulator.js - Logique du simulateur d'expédition
import { getPetById, getExpeditionById, getPetExpeditionPreference } from './state.js';
import { EXPEDITION_CONSTANTS, RARITY_NAMES, LOCATION_NAMES } from './constants.js';
import { formatDuration, getCategoryName, escapeHTML } from './utils.js';
import {
    calculateRewardIndex,
    calculateEffectiveRisk,
    calculateSpeedDurationModifier,
    calculateRewards,
    calculateItemRarityRange,
    calculateTalismanDropChance,
    calculateProfitabilityScore,
    calculateExpectedTokens,
    formatScoreDisplay,
    formatScoreDisplayExpanded,
    formatRiskAnalysis,
    describeRewardCategory
} from './calculations.js';
import { getSelectedExpedition, showToast } from './ui.js';

export function simulateExpedition() {
    const petIdInput = document.getElementById('selectedPetId');
    const petId = petIdInput ? parseInt(petIdInput.value, 10) : NaN;
    const pet = getPetById(petId);

    if (!pet) {
        showToast('⚠️ Veuillez sélectionner un familier');
        return;
    }

    // Récupérer l'expédition sélectionnée
    const { id: expeditionId, type: locationType } = getSelectedExpedition();
    const expedition = expeditionId ? getExpeditionById(expeditionId) : null;
    
    if (!locationType) {
        showToast('⚠️ Veuillez sélectionner une expédition');
        return;
    }

    const lovePoints = Math.max(20, Math.min(110, parseInt(document.getElementById('lovePoints').value, 10)));
    const baseDuration = Math.max(10, Math.min(4320, parseInt(document.getElementById('duration').value, 10)));
    const riskRate = Math.max(0, Math.min(100, parseInt(document.getElementById('riskRate').value, 10)));
    const difficulty = Math.max(0, Math.min(100, parseInt(document.getElementById('difficulty').value, 10)));
    const wealthRate = Math.max(0, Math.min(200, parseInt(document.getElementById('wealthRate').value, 10))) / 100;
    const hasCloneTalisman = document.getElementById('hasCloneTalisman').checked;
    const hasTalismanBonus = document.getElementById('hasTalismanBonus').checked;
    const hasTokenBonus = document.getElementById('hasTokenBonus')?.checked ?? false;
    const hasEnoughFood = document.getElementById('hasEnoughFood').checked;

    const speedModifier = calculateSpeedDurationModifier(pet.speed);
    const effectiveDuration = Math.round(baseDuration * speedModifier);
    const rewardIndex = calculateRewardIndex(baseDuration, riskRate, difficulty, wealthRate);
    const foodRequired = EXPEDITION_CONSTANTS.FOOD_CONSUMPTION[rewardIndex];
    const foodConsumed = hasEnoughFood ? foodRequired : 0;
    
    // Obtenir la préférence du familier pour ce terrain
    const petPreference = getPetExpeditionPreference(pet.petTypeId, locationType);
    
    // Calculer le risque effectif avec la préférence de terrain
    const effectiveRisk = calculateEffectiveRisk(riskRate, difficulty, pet.force, lovePoints, foodConsumed, foodRequired, pet.petTypeId, locationType, effectiveDuration);

    // Calcul selon Crownicles: 2 rolls successifs avec effectiveRisk%
    // 1. Roll échec total (effectiveRisk%)
    // 2. Si pas échec, roll succès partiel (effectiveRisk%)
    const riskRatio = effectiveRisk / 100;
    const failureRate = effectiveRisk; // P(échec) = R
    const partialSuccessRate = (1 - riskRatio) * riskRatio * 100; // P(partiel) = (1-R) × R
    const totalSuccessRate = Math.pow(1 - riskRatio, 2) * 100; // P(total) = (1-R)²

    const rewards = calculateRewards(rewardIndex, locationType, effectiveDuration, hasTokenBonus);
    const expectedTokens = calculateExpectedTokens(rewardIndex, effectiveDuration, hasTokenBonus);
    const { minRarity, maxRarity } = calculateItemRarityRange(rewardIndex);
    const baseTalismanChance = calculateTalismanDropChance(rewardIndex, false);
    const bonusTalismanChance = calculateTalismanDropChance(rewardIndex, true);
    const weightedTalismanChance = (baseTalismanChance * totalSuccessRate) / 100;
    const weightedBonusTalismanChance = (bonusTalismanChance * totalSuccessRate) / 100;
    const talismanChanceForScore = hasCloneTalisman ? 0 : (hasTalismanBonus ? bonusTalismanChance : baseTalismanChance);

    const profitabilityScore = calculateProfitabilityScore(
        rewardIndex,
        totalSuccessRate,
        partialSuccessRate,
        failureRate,
        effectiveDuration,
        rewards,
        talismanChanceForScore,
        hasTalismanBonus,
        hasTokenBonus
    );

    displayResults({
        pet,
        expedition,
        lovePoints,
        baseDuration,
        effectiveDuration,
        speedModifier,
        locationType,
        riskRate,
        difficulty,
        wealthRate,
        rewardIndex,
        foodRequired,
        hasEnoughFood,
        effectiveRisk,
        failureRate,
        partialSuccessRate,
        totalSuccessRate,
        rewards,
        expectedTokens,
        minRarity,
        maxRarity,
        hasCloneTalisman,
        hasTalismanBonus,
        hasTokenBonus,
        baseTalismanChance,
        bonusTalismanChance,
        weightedTalismanChance,
        weightedBonusTalismanChance,
        profitabilityScore,
        petPreference
    });

    showToast();
}

function displayResults(data) {
    const resultsDiv = document.getElementById('results');
    if (!resultsDiv) return;

    resultsDiv.style.display = 'block';
    resultsDiv.classList.add('show');

    // Afficher le nom de l'expédition si disponible
    const expeditionDisplay = data.expedition 
        ? `${EXPEDITION_CONSTANTS.LOCATION_EMOJIS[data.locationType]} ${escapeHTML(data.expedition.name)} <span class="type-badge">${LOCATION_NAMES[data.locationType]}</span>`
        : `${EXPEDITION_CONSTANTS.LOCATION_EMOJIS[data.locationType]} ${escapeHTML(LOCATION_NAMES[data.locationType])}`;

    // Quick Summary
    const quickSummary = document.getElementById('quickSummary');
    if (quickSummary) {
        const successClass = data.totalSuccessRate >= 70 ? 'positive' : data.totalSuccessRate >= 40 ? 'neutral' : 'negative';
        quickSummary.innerHTML = `
            <div class="quick-summary-items">
                <span class="summary-item">${expeditionDisplay}</span>
                <span class="summary-divider">•</span>
                <span class="summary-item"><strong>${escapeHTML(data.pet.name)}</strong></span>
                <span class="summary-divider">•</span>
                <span class="summary-item ${successClass}">${data.totalSuccessRate.toFixed(1)}% succès</span>
                <span class="summary-divider">•</span>
                <span class="summary-item">⏱️ ${formatDuration(data.effectiveDuration)}</span>
            </div>
        `;
    }

    // Header profitability score (compact)
    const profitabilityContainer = document.getElementById('profitabilityScoreDisplay');
    if (profitabilityContainer) {
        profitabilityContainer.innerHTML = formatScoreDisplay(data.profitabilityScore);
    }

    // Expanded profitability score
    const profitabilityExpanded = document.getElementById('profitabilityScoreExpanded');
    if (profitabilityExpanded) {
        profitabilityExpanded.innerHTML = formatScoreDisplayExpanded(data);
    }

    // Summary table (details tab)
    const summaryBody = document.querySelector('#summaryTable tbody');
    if (summaryBody) {
        summaryBody.innerHTML = `
            <tr><td>🐾 Familier</td><td>${escapeHTML(data.pet.name)} (Force: ${escapeHTML(data.pet.force)}, Vitesse: ${escapeHTML(data.pet.speed)})</td></tr>
            <tr><td>🗺️ Expédition</td><td>${expeditionDisplay}</td></tr>
            <tr><td>💕 Points d'amour</td><td>${escapeHTML(data.lovePoints)}</td></tr>
            <tr><td>⏱️ Durée de base</td><td>${formatDuration(data.baseDuration)}</td></tr>
            <tr><td>🚀 Modificateur de vitesse</td><td>x${data.speedModifier.toFixed(2)} (${data.speedModifier < 1 ? '-' : '+'}${Math.abs(Math.round((1 - data.speedModifier) * 100))}%)</td></tr>
            <tr><td>🕐 Durée effective</td><td>${formatDuration(data.effectiveDuration)}</td></tr>
            <tr><td>⚠️ Dangerosité initiale</td><td>${escapeHTML(data.riskRate)}% (${getCategoryName(data.riskRate, EXPEDITION_CONSTANTS.RISK_CATEGORIES)})</td></tr>
            <tr><td>🎯 Difficulté</td><td>${escapeHTML(data.difficulty)} (${getCategoryName(data.difficulty, EXPEDITION_CONSTANTS.DIFFICULTY_CATEGORIES)})</td></tr>
            <tr><td>💎 Taux de richesse</td><td>${data.wealthRate.toFixed(2)} (${getCategoryName(data.wealthRate, EXPEDITION_CONSTANTS.WEALTH_CATEGORIES)})</td></tr>
            <tr><td>🍖 Rations requises</td><td>${escapeHTML(data.foodRequired)} ${data.hasEnoughFood ? '✅' : '❌ (risque x3)'}</td></tr>
            <tr><td>📊 Risque effectif</td><td>${data.effectiveRisk.toFixed(1)}%</td></tr>
            <tr><td>⭐ Index de récompense</td><td>${escapeHTML(data.rewardIndex)}/9 (${describeRewardCategory(data.rewardIndex)})</td></tr>
            <tr><td>🧬 Bonus talisman</td><td>${data.hasTalismanBonus ? '✅ Oui (x10)' : '❌ Non'}</td></tr>
            <tr><td>🪙 Bonus tokens</td><td>${data.hasTokenBonus ? '✅ Oui (x3)' : '❌ Non'}</td></tr>
        `;
    }

    // Update cancel love change based on love points
    const cancelLoveChange = document.getElementById('cancelLoveChange');
    if (cancelLoveChange) {
        const cancelPenalty = data.lovePoints > 80 ? Math.floor((data.lovePoints - 80) / 2) + 15 : 15;
        cancelLoveChange.textContent = `-${cancelPenalty}`;
    }

    // Update love changes based on pet preference (officiel Crownicles)
    const loveConfig = EXPEDITION_CONSTANTS.LOVE_CHANGES;
    const isLikedTerrain = data.petPreference === 'liked';
    
    // Succès total: +5 base, x2 si terrain aimé = +10
    const successLove = isLikedTerrain 
        ? loveConfig.TOTAL_SUCCESS * loveConfig.LIKED_EXPEDITION_MULTIPLIER 
        : loveConfig.TOTAL_SUCCESS;
    
    // Succès partiel: +2 UNIQUEMENT si terrain aimé, sinon 0
    const partialLove = isLikedTerrain ? loveConfig.PARTIAL_SUCCESS : 0;
    
    // Échec total: -3 (fixe)
    const failureLove = loveConfig.TOTAL_FAILURE;
    
    const successLoveEl = document.getElementById('successLoveChange');
    const partialLoveEl = document.getElementById('partialLoveChange');
    const failureLoveEl = document.getElementById('failureLoveChange');
    const preferenceIndicator = document.getElementById('preferenceIndicator');
    
    if (successLoveEl) {
        successLoveEl.textContent = `+${successLove}`;
        successLoveEl.className = 'love-value positive';
    }
    if (partialLoveEl) {
        partialLoveEl.textContent = partialLove > 0 ? `+${partialLove}` : '0';
        partialLoveEl.className = partialLove > 0 ? 'love-value positive' : 'love-value neutral';
    }
    if (failureLoveEl) {
        failureLoveEl.textContent = `${failureLove}`;
        failureLoveEl.className = 'love-value negative';
    }
    if (preferenceIndicator) {
        const prefEmoji = data.petPreference === 'liked' ? '❤️' : data.petPreference === 'disliked' ? '💔' : '🐾';
        const prefText = data.petPreference === 'liked' ? 'Terrain aimé (bonus x2)' : data.petPreference === 'disliked' ? 'Terrain détesté' : 'Terrain neutre';
        const prefColor = data.petPreference === 'liked' ? 'var(--success)' : data.petPreference === 'disliked' ? 'var(--danger)' : 'var(--text-secondary)';
        preferenceIndicator.innerHTML = `<span style="color: ${prefColor}; font-size: 0.9em; display: block; margin-bottom: 8px;">${prefEmoji} ${prefText}</span>`;
    }

    // Risk Analysis
    const riskAnalysis = document.getElementById('riskAnalysis');
    if (riskAnalysis) {
        riskAnalysis.innerHTML = formatRiskAnalysis(data);
    }

    const successSegment = document.getElementById('progressSuccess');
    const partialSegment = document.getElementById('progressPartial');
    const failureSegment = document.getElementById('progressFailure');
    if (successSegment && partialSegment && failureSegment) {
        successSegment.style.width = `${data.totalSuccessRate}%`;
        successSegment.textContent = data.totalSuccessRate >= 10 ? `${data.totalSuccessRate.toFixed(1)}%` : '';
        partialSegment.style.width = `${data.partialSuccessRate}%`;
        partialSegment.textContent = data.partialSuccessRate >= 10 ? `${data.partialSuccessRate.toFixed(1)}%` : '';
        failureSegment.style.width = `${data.failureRate}%`;
        failureSegment.textContent = data.failureRate >= 10 ? `${data.failureRate.toFixed(1)}%` : '';
    }

    const legendSuccess = document.getElementById('legendSuccess');
    const legendPartial = document.getElementById('legendPartial');
    const legendFailure = document.getElementById('legendFailure');
    if (legendSuccess) legendSuccess.textContent = data.totalSuccessRate.toFixed(1);
    if (legendPartial) legendPartial.textContent = data.partialSuccessRate.toFixed(1);
    if (legendFailure) legendFailure.textContent = data.failureRate.toFixed(1);

    const rewardsBody = document.querySelector('#rewardsTable tbody');
    if (rewardsBody) {
        const locationWeights = EXPEDITION_CONSTANTS.LOCATION_REWARD_WEIGHTS[data.locationType];
        const formatMultiplierBadge = (mult) => {
            const color = mult > 1 ? '#22c55e' : mult < 1 ? '#ef4444' : '#eab308';
            return `<span style="background: ${color}; color: white; padding: 2px 6px; border-radius: 4px; font-size: 0.75em; margin-left: 6px; font-weight: bold;">×${mult.toFixed(1)}</span>`;
        };

        const tokenBonusBadge = data.hasTokenBonus 
            ? '<span style="background: #8b5cf6; color: white; padding: 2px 6px; border-radius: 4px; font-size: 0.75em; margin-left: 6px; font-weight: bold;">×3</span>' 
            : '';

        rewardsBody.innerHTML = `
            <tr>
                <td>🪙 Tokens ${tokenBonusBadge}</td>
                <td class="multiplier-cell mult-full">${data.expectedTokens.min}-${data.expectedTokens.max}</td>
                <td class="multiplier-cell mult-partial">${Math.ceil(data.expectedTokens.min / 2)}-${Math.ceil(data.expectedTokens.max / 2)}</td>
                <td class="multiplier-cell mult-none">0</td>
            </tr>
            <tr>
                <td>🏅 Points ${formatMultiplierBadge(locationWeights.points)}</td>
                <td class="multiplier-cell mult-full">${data.rewards.points}</td>
                <td class="multiplier-cell mult-partial">${Math.round(data.rewards.points / 2)}</td>
                <td class="multiplier-cell mult-none">0</td>
            </tr>
            <tr>
                <td>⭐ Expérience ${formatMultiplierBadge(locationWeights.experience)}</td>
                <td class="multiplier-cell mult-full">${data.rewards.experience}</td>
                <td class="multiplier-cell mult-partial">${Math.round(data.rewards.experience / 2)}</td>
                <td class="multiplier-cell mult-none">0</td>
            </tr>
            <tr>
                <td>💰 Argent ${formatMultiplierBadge(locationWeights.money)}</td>
                <td class="multiplier-cell mult-full">${data.rewards.money}</td>
                <td class="multiplier-cell mult-partial">${Math.round(data.rewards.money / 2)}</td>
                <td class="multiplier-cell mult-none">0</td>
            </tr>
        `;
    }

    const talismanBody = document.querySelector('#talismanTable tbody');
    const talismanHeaderRow = document.querySelector('#talismanTable thead tr');
    if (talismanBody && talismanHeaderRow) {
        if (data.hasCloneTalisman) {
            talismanHeaderRow.innerHTML = '<th>Condition</th><th>Info</th>';
            talismanBody.innerHTML = `
                <tr>
                    <td colspan="2" style="text-align: center; color: var(--text-secondary);">
                        Vous possédez déjà le talisman de clonage - Aucune chance de drop
                    </td>
                </tr>
            `;
        } else if (data.hasTalismanBonus) {
            talismanHeaderRow.innerHTML = '<th>Condition</th><th>Chance de base</th><th>Avec bonus ×10</th><th>Succès pondéré</th>';
            talismanBody.innerHTML = `
                <tr>
                    <td>🧬 Talisman de clonage</td>
                    <td>${data.baseTalismanChance.toFixed(2)}%</td>
                    <td>${data.bonusTalismanChance.toFixed(2)}%</td>
                    <td>${data.weightedBonusTalismanChance.toFixed(3)}%</td>
                </tr>
                <tr>
                    <td colspan="4" style="font-size: 0.85em; color: var(--text-secondary);">
                        Note: Le talisman ne peut être obtenu qu'en cas de succès total.
                        Le succès pondéré = chance avec bonus × taux de succès total.
                    </td>
                </tr>
            `;
        } else {
            talismanHeaderRow.innerHTML = '<th>Condition</th><th>Chance</th><th>Succès pondéré</th>';
            talismanBody.innerHTML = `
                <tr>
                    <td>🧬 Talisman de clonage</td>
                    <td>${data.baseTalismanChance.toFixed(2)}%</td>
                    <td>${data.weightedTalismanChance.toFixed(3)}%</td>
                </tr>
                <tr>
                    <td colspan="3" style="font-size: 0.85em; color: var(--text-secondary);">
                        Note: Le talisman ne peut être obtenu qu'en cas de succès total.
                        Le succès pondéré = chance × taux de succès total.
                    </td>
                </tr>
            `;
        }
    }

    const itemRarityDiv = document.getElementById('itemRarityDisplay');
    if (itemRarityDiv) {
        let rarityHTML = '<div style="display: flex; gap: 10px; flex-wrap: wrap;">';
        for (let rarity = data.minRarity; rarity <= data.maxRarity; rarity++) {
            rarityHTML += `<span class="rarity-badge rarity-${rarity}">${RARITY_NAMES[rarity]}</span>`;
        }
        rarityHTML += '</div>';
        rarityHTML += `
            <p style="margin-top: 10px; font-size: 0.9em; color: var(--text-secondary);">
                Rareté min: ${RARITY_NAMES[data.minRarity]} | Rareté max: ${RARITY_NAMES[data.maxRarity]}<br>
                Formule: min = max(1, rewardIndex - 4), max = selon table
            </p>
        `;
        itemRarityDiv.innerHTML = rarityHTML;
    }

    resultsDiv.scrollIntoView({ behavior: 'smooth', block: 'start' });
}
