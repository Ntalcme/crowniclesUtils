import { fetchPetData } from './dataService.js';
import {
    initPetDropdown,
    initAnalyzerPetDropdown,
    initSliders,
    initAnalyzerSliders,
    initBranchSelect,
    initExpeditionDropdown,
    initAnalyzerExpeditionDropdown,
    showToast
} from './ui.js';
import { escapeHTML } from './utils.js';
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

    // Gestion des onglets dans les résultats
    initResultsTabs();
}

function initResultsTabs() {
    // Écouter les clics sur les onglets de résultats (délégation)
    document.addEventListener('click', (event) => {
        const tab = event.target.closest('.results-tab');
        if (!tab) return;
        
        const tabName = tab.dataset.tab;
        if (!tabName) return;
        
        // Trouver le conteneur parent (simulateur ou analyseur)
        const tabsContainer = tab.closest('.results-tabs');
        if (!tabsContainer) return;
        
        // Activer l'onglet dans ce conteneur uniquement
        tabsContainer.querySelectorAll('.results-tab').forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        
        // Trouver le conteneur de panels correspondant
        const tabContent = tabsContainer.nextElementSibling;
        if (!tabContent || !tabContent.classList.contains('results-tab-content')) return;
        
        // Afficher le panel correspondant dans ce conteneur uniquement
        tabContent.querySelectorAll('.tab-panel').forEach(p => p.classList.remove('active'));
        const panel = document.getElementById(`panel-${tabName}`);
        if (panel) panel.classList.add('active');
    });
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
    const branchInput = document.getElementById('selectedBranch');
    const loadButton = document.getElementById('loadButton');
    const statusDiv = document.getElementById('loadingStatus');
    if (!branchInput || !loadButton || !statusDiv) return;

    const branch = branchInput.value;
    loadButton.disabled = true;
    const originalText = loadButton.textContent;
    loadButton.textContent = '⏳ Chargement...';
    statusDiv.innerHTML = '<div class="loading"><div class="loading-spinner"></div><p>Chargement des données depuis GitHub...</p></div>';

    try {
        const { pets } = await fetchPetData(branch);
        statusDiv.innerHTML = `<p style="color: var(--success);">✅ ${escapeHTML(pets.length)} familiers chargés avec succès depuis la branche <strong>${escapeHTML(branch)}</strong></p>`;
        revealSimulatorUI();
        showToast('✅ Données chargées !');
    } catch (error) {
        statusDiv.innerHTML = `<p style="color: var(--danger);">❌ Erreur: ${escapeHTML(error.message)}</p>`;
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
    
    // Initialiser les dropdowns des expéditions après le chargement des données
    initExpeditionDropdown();
    initAnalyzerExpeditionDropdown();
    initPetDropdown();
    initAnalyzerPetDropdown();
}

async function bootstrap() {
    try {
        await loadViews();
    } catch (error) {
        // En production, logger l'erreur sans exposer les détails
        if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
            console.error(error);
        }
        alert('Impossible de charger les vues. Vérifiez que vous servez les fichiers via un serveur HTTP.');
        return;
    }

    await initBranchSelect();
    initSliders();
    initAnalyzerSliders();
    // Les dropdowns pet et expedition sont initialisés dans revealSimulatorUI après le chargement des données
    registerGlobalEvents();
}

document.addEventListener('DOMContentLoaded', bootstrap);
