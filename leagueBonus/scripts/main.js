// main.js - Point d'entrée de l'application
import { calculateRewards, getRankCategory } from './calculations.js';
import { displayResults, showToast } from './ui.js';

// Initialisation au chargement de la page
document.addEventListener('DOMContentLoaded', () => {
    const calculateButton = document.getElementById('calculateButton');
    const leagueSelect = document.getElementById('leagueSelect');
    const rankInput = document.getElementById('rankInput');

    if (calculateButton) {
        calculateButton.addEventListener('click', handleCalculate);
    }

    // Permettre le calcul avec la touche Entrée
    if (rankInput) {
        rankInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                handleCalculate();
            }
        });
    }
});

/**
 * Gère le calcul des récompenses
 */
function handleCalculate() {
    const leagueSelect = document.getElementById('leagueSelect');
    const rankInput = document.getElementById('rankInput');

    if (!leagueSelect || !rankInput) {
        showToast('⚠️ Erreur : éléments manquants');
        return;
    }

    const league = leagueSelect.value;
    const rank = parseInt(rankInput.value, 10);

    // Validation
    if (!rank || rank < 1) {
        showToast('⚠️ Veuillez entrer un rang valide (minimum 1)');
        return;
    }

    // Calcul des récompenses
    const rewards = calculateRewards(league, rank);
    const rankCategory = getRankCategory(rank);

    // Affichage des résultats
    displayResults({
        league,
        rank,
        rewards,
        rankCategory
    });

    if (rank > 200) {
        showToast('✅ Récompenses calculées ! (Pas de points bonus au-delà du top 200)');
    } else {
        showToast('✅ Récompenses calculées !');
    }
}
