// main.js - Point d'entrée de l'application
import { fetchPetData } from './dataService.js';
import {
    initPetDropdown,
    initAnalyzerPetDropdown,
    initSliders,
    initAnalyzerSliders,
    showToast
} from './ui.js';
import { simulateExpedition } from './simulator.js';
import { analyzeExpedition } from './analyzer.js';

async function loadView(containerId, viewPath) {
    const container = document.getElementById(containerId);
    if (!container) return;
    const response = await fetch(viewPath);
    if (!response.ok) {
        throw new Error(`Impossible de charger la vue ${viewPath}`);
    }
    container.innerHTML = await response.text();
}

async function loadViews() {
    await loadView('simulatorMount', 'views/simulator.html');
    await loadView('resultsMount', 'views/results.html');
    await loadView('analyzerMount', 'views/analyzer.html');
}

function registerGlobalEvents() {
    const loadButton = document.getElementById('loadButton');
    if (loadButton) loadButton.addEventListener('click', handleLoadData);

    const simulateButton = document.getElementById('simulateButton');
    if (simulateButton) simulateButton.addEventListener('click', simulateExpedition);

    const analyzeButton = document.getElementById('analyzeButton');
    if (analyzeButton) analyzeButton.addEventListener('click', analyzeExpedition);

    const tabNav = document.getElementById('tabNav');
    if (tabNav) {
        tabNav.addEventListener('click', (event) => {
            const button = event.target.closest('.tab-btn');
            if (!button) return;
            event.preventDefault();
            activateTab(button.dataset.target);
        });
    }
}

function activateTab(target) {
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.target === target);
    });

    document.querySelectorAll('.tab-content').forEach(content => {
        content.classList.toggle('active', content.id === `tab-${target}`);
    });
}

async function handleLoadData() {
    const branchSelect = document.getElementById('branchSelect');
    const loadButton = document.getElementById('loadButton');
    const statusDiv = document.getElementById('loadingStatus');
    if (!branchSelect || !loadButton || !statusDiv) return;

    const branch = branchSelect.value;
    loadButton.disabled = true;
    const originalText = loadButton.textContent;
    loadButton.textContent = '⏳ Chargement...';
    statusDiv.innerHTML = '<div class="loading"><div class="loading-spinner"></div><p>Chargement des données depuis GitHub...</p></div>';

    try {
        const { pets } = await fetchPetData(branch);
        statusDiv.innerHTML = `<p style="color: var(--success);">✅ ${pets.length} familiers chargés avec succès depuis la branche <strong>${branch}</strong></p>`;
        revealSimulatorUI();
        showToast('✅ Données chargées !');
    } catch (error) {
        statusDiv.innerHTML = `<p style="color: var(--danger);">❌ Erreur: ${error.message}</p>`;
    } finally {
        loadButton.disabled = false;
        loadButton.textContent = '🔄 Recharger les données';
    }
}

function revealSimulatorUI() {
    const tabNav = document.getElementById('tabNav');
    const simulatorCard = document.getElementById('simulatorCard');
    if (tabNav) tabNav.style.display = 'flex';
    if (simulatorCard) simulatorCard.style.display = 'block';
    activateTab('simulator');
}

async function bootstrap() {
    try {
        await loadViews();
    } catch (error) {
        console.error(error);
        alert('Impossible de charger les vues. Vérifiez que vous servez les fichiers via un serveur HTTP.');
        return;
    }

    initSliders();
    initAnalyzerSliders();
    initPetDropdown();
    initAnalyzerPetDropdown();
    registerGlobalEvents();
}

document.addEventListener('DOMContentLoaded', bootstrap);
