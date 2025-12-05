// ui.js - Gestion de l'interface utilisateur
import { LEAGUE_NAMES, LEAGUE_EMOJIS } from './constants.js';

/**
 * Affiche un toast de notification
 * @param {string} message - Message à afficher
 */
export function showToast(message) {
    const toast = document.getElementById('toast');
    if (!toast) return;

    toast.textContent = message;
    toast.classList.add('show');

    setTimeout(() => {
        toast.classList.remove('show');
    }, 3000);
}

/**
 * Affiche les résultats calculés
 * @param {Object} data - Données à afficher
 */
export function displayResults(data) {
    const resultsDiv = document.getElementById('results');
    if (!resultsDiv) return;

    resultsDiv.style.display = 'block';

    // Afficher les récompenses
    const rewardsDisplay = document.getElementById('rewardsDisplay');
    if (rewardsDisplay) {
        const pointsDisplay = data.rewards.points > 0 
            ? `<div class="reward-item">
                    <div class="reward-icon">🏅</div>
                    <div class="reward-label">Points bonus</div>
                    <div class="reward-value">${data.rewards.points.toLocaleString()}</div>
                </div>`
            : `<div class="reward-item" style="opacity: 0.5;">
                    <div class="reward-icon">🏅</div>
                    <div class="reward-label">Points bonus</div>
                    <div class="reward-value">0</div>
                    <small style="color: var(--text-secondary); font-size: 0.8em;">Uniquement top 200</small>
                </div>`;

        rewardsDisplay.innerHTML = `
            <div class="rewards-grid">
                <div class="reward-item">
                    <div class="reward-icon">💰</div>
                    <div class="reward-label">Argent</div>
                    <div class="reward-value">${data.rewards.money.toLocaleString()}</div>
                </div>
                <div class="reward-item">
                    <div class="reward-icon">⭐</div>
                    <div class="reward-label">Expérience</div>
                    <div class="reward-value">${data.rewards.experience.toLocaleString()}</div>
                </div>
                ${pointsDisplay}
            </div>
        `;
    }

    // Afficher les détails
    const detailsTable = document.getElementById('detailsTable');
    if (detailsTable) {
        detailsTable.innerHTML = `
            <tr>
                <td>🏆 Ligue saison précédente</td>
                <td><span class="league-badge league-${data.league}">${LEAGUE_EMOJIS[data.league]} ${LEAGUE_NAMES[data.league]}</span></td>
            </tr>
            <tr>
                <td>📊 Rang final</td>
                <td><strong>#${data.rank}</strong> - ${data.rankCategory}</td>
            </tr>
            <tr>
                <td>📅 Disponibilité</td>
                <td>Dimanche uniquement</td>
            </tr>
        `;
    }

    // Afficher les informations sur l'objet
    const itemInfo = document.getElementById('itemInfo');
    if (itemInfo) {
        const raritiesHTML = data.rewards.itemRarities.map(item => `
            <div style="display: flex; align-items: center; justify-content: space-between; padding: 10px; background: var(--card-bg); border-left: 4px solid ${item.color}; border-radius: 4px; margin-bottom: 8px;">
                <div style="display: flex; align-items: center; gap: 10px;">
                    <span style="font-size: 1.5em;">${item.icon}</span>
                    <span style="font-weight: 500;">${item.name}</span>
                </div>
                <div style="display: flex; align-items: center; gap: 8px;">
                    <div style="background: ${item.color}; color: white; padding: 4px 12px; border-radius: 12px; font-weight: bold; font-size: 0.9em;">
                        ${item.probability.toFixed(1)}%
                    </div>
                </div>
            </div>
        `).join('');

        itemInfo.innerHTML = `
            <p style="margin-bottom: 15px; text-align: center;">
                Vous recevrez <strong>1 objet aléatoire</strong> avec les probabilités suivantes :
            </p>
            <div style="max-width: 500px; margin: 0 auto;">
                ${raritiesHTML}
            </div>
            <p style="font-size: 0.85em; color: var(--text-secondary); text-align: center; margin-top: 15px;">
                La probabilité est équitablement répartie entre les raretés disponibles
            </p>
        `;
    }

    // Scroll vers les résultats
    resultsDiv.scrollIntoView({ behavior: 'smooth', block: 'start' });
}
