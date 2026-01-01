// ui.js - Gestion des interactions d'interface
import { getPets, getPetById, getExpeditions, getExpeditionById } from './state.js';
import { EXPEDITION_CONSTANTS, RARITY_NAMES, LOCATION_NAMES, LOCATION_DESCRIPTIONS } from './constants.js';
import { formatDuration, getCategoryName, escapeHTML, normalizeString } from './utils.js';
import { fetchGitHubBranches } from './dataService.js';

let dropdownCloseHandlerRegistered = false;

function ensureDropdownCloseHandler() {
    if (dropdownCloseHandlerRegistered) return;
    document.addEventListener('click', (event) => {
        if (!event.target.closest('.searchable-select-container')) {
            document.querySelectorAll('.dropdown-list').forEach(list => list.classList.remove('show'));
        }
    });
    dropdownCloseHandlerRegistered = true;
}

function renderDropdownItems(dropdown, filter) {
    const normalizedFilter = normalizeString(filter || '');
    const pets = getPets().filter(pet => normalizeString(pet.name).includes(normalizedFilter));
    dropdown.innerHTML = pets.map(pet => `
        <div class="dropdown-item" data-pet-id="${pet.id}">
            <span class="pet-name">${pet.name}</span>
            <span class="pet-stats">
                <span class="rarity-badge rarity-${pet.rarity}">${RARITY_NAMES[pet.rarity]}</span>
                💪${pet.force} 🚀${pet.speed}
            </span>
        </div>
    `).join('');
}

function setupPetDropdown(searchInputId, dropdownId, onSelect) {
    const searchInput = document.getElementById(searchInputId);
    const dropdown = document.getElementById(dropdownId);
    if (!searchInput || !dropdown) return;

    ensureDropdownCloseHandler();

    const render = (filter = '') => renderDropdownItems(dropdown, filter);

    searchInput.addEventListener('focus', () => {
        render('');
        dropdown.classList.add('show');
    });

    searchInput.addEventListener('input', (event) => {
        render(event.target.value);
        dropdown.classList.add('show');
    });

    dropdown.addEventListener('click', (event) => {
        const item = event.target.closest('.dropdown-item');
        if (!item) return;
        const petId = Number(item.dataset.petId);
        onSelect(petId);
        dropdown.classList.remove('show');
    });
}

export function initPetDropdown() {
    setupPetDropdown('petSearch', 'petDropdown', selectPet);
}

export function initAnalyzerPetDropdown() {
    setupPetDropdown('analyzerPetSearch', 'analyzerPetDropdown', selectAnalyzerPet);
}

function selectPetGeneric(petId, searchInputId, hiddenInputId, statsDivId) {
    const pet = getPetById(petId);
    if (!pet) return;

    const searchInput = document.getElementById(searchInputId);
    const hiddenInput = document.getElementById(hiddenInputId);
    const statsDiv = document.getElementById(statsDivId);

    if (searchInput) searchInput.value = pet.name;
    if (hiddenInput) hiddenInput.value = String(petId);
    if (statsDiv) {
        statsDiv.style.display = 'flex';
        statsDiv.innerHTML = `
            <div class="stat-item">Rareté: <span class="rarity-badge rarity-${pet.rarity}">${RARITY_NAMES[pet.rarity]}</span></div>
            <div class="stat-item">Force: <span>${escapeHTML(pet.force)}</span></div>
            <div class="stat-item">Vitesse: <span>${escapeHTML(pet.speed)}</span></div>
        `;
    }
}

export function selectPet(petId) {
    selectPetGeneric(petId, 'petSearch', 'selectedPetId', 'selectedPetStats');
}

export function selectAnalyzerPet(petId) {
    selectPetGeneric(petId, 'analyzerPetSearch', 'analyzerSelectedPetId', 'analyzerSelectedPetStats');
}

export function initSliders() {
    const loveSlider = document.getElementById('lovePoints');
    const loveValue = document.getElementById('loveValue');
    const loveHint = document.getElementById('loveMinHint');
    
    if (loveSlider && loveValue) {
        const updateLove = () => {
            const val = parseInt(loveSlider.value, 10);
            loveValue.textContent = val;
            // Afficher le message uniquement quand 80 points sont sélectionnés
            if (loveHint) {
                loveHint.style.display = val === 80 ? 'block' : 'none';
            }
        };
        loveSlider.addEventListener('input', updateLove);
        updateLove();
    }

    const durationSlider = document.getElementById('duration');
    const durationValue = document.getElementById('durationValue');
    if (durationSlider && durationValue) {
        const updateDuration = () => {
            durationValue.textContent = formatDuration(parseInt(durationSlider.value, 10));
        };
        durationSlider.addEventListener('input', updateDuration);
        updateDuration();
    }

    const riskSlider = document.getElementById('riskRate');
    const riskValue = document.getElementById('riskValue');
    const riskCategory = document.getElementById('riskCategory');
    if (riskSlider && riskValue && riskCategory) {
        const updateRisk = () => {
            const val = parseInt(riskSlider.value, 10);
            riskValue.textContent = `${val}%`;
            riskCategory.textContent = `Catégorie: ${getCategoryName(val, EXPEDITION_CONSTANTS.RISK_CATEGORIES)}`;
        };
        riskSlider.addEventListener('input', updateRisk);
        updateRisk();
    }

    const diffSlider = document.getElementById('difficulty');
    const diffValue = document.getElementById('difficultyValue');
    const diffCategory = document.getElementById('difficultyCategory');
    if (diffSlider && diffValue && diffCategory) {
        const updateDiff = () => {
            const val = parseInt(diffSlider.value, 10);
            diffValue.textContent = String(val);
            diffCategory.textContent = `Catégorie: ${getCategoryName(val, EXPEDITION_CONSTANTS.DIFFICULTY_CATEGORIES)}`;
        };
        diffSlider.addEventListener('input', updateDiff);
        updateDiff();
    }

    const wealthSlider = document.getElementById('wealthRate');
    const wealthValue = document.getElementById('wealthValue');
    const wealthCategory = document.getElementById('wealthCategory');
    if (wealthSlider && wealthValue && wealthCategory) {
        const updateWealth = () => {
            const val = parseInt(wealthSlider.value, 10) / 100;
            wealthValue.textContent = val.toFixed(2);
            wealthCategory.textContent = `Catégorie: ${getCategoryName(val, EXPEDITION_CONSTANTS.WEALTH_CATEGORIES)}`;
        };
        wealthSlider.addEventListener('input', updateWealth);
        updateWealth();
    }

    initBonusExclusivity();
}

// =============== EXPEDITION DROPDOWN ===============

function renderExpeditionDropdownItems(dropdown, filter, groupByType = true) {
    const normalizedFilter = normalizeString(filter || '');
    const expeditions = getExpeditions().filter(exp => 
        normalizeString(exp.name).includes(normalizedFilter) ||
        normalizeString(LOCATION_NAMES[exp.type] || '').includes(normalizedFilter)
    );
    
    if (groupByType && !filter) {
        // Grouper par type d'expédition
        const grouped = {};
        expeditions.forEach(exp => {
            if (!grouped[exp.type]) grouped[exp.type] = [];
            grouped[exp.type].push(exp);
        });
        
        let html = '';
        const typeOrder = ['plains', 'forest', 'mountain', 'desert', 'swamp', 'coast', 'ruins', 'cave'];
        
        typeOrder.forEach(type => {
            if (!grouped[type] || grouped[type].length === 0) return;
            const emoji = EXPEDITION_CONSTANTS.LOCATION_EMOJIS[type] || '📍';
            const typeName = LOCATION_NAMES[type] || type;
            
            html += `<div class="dropdown-group-header">${emoji} ${typeName}</div>`;
            grouped[type].forEach(exp => {
                html += renderExpeditionItem(exp);
            });
        });
        
        dropdown.innerHTML = html;
    } else {
        dropdown.innerHTML = expeditions.map(exp => renderExpeditionItem(exp)).join('');
    }
}

function renderExpeditionItem(exp) {
    const emoji = EXPEDITION_CONSTANTS.LOCATION_EMOJIS[exp.type] || '📍';
    const typeName = LOCATION_NAMES[exp.type] || exp.type;
    return `
        <div class="dropdown-item expedition-item" data-expedition-id="${exp.id}" data-expedition-type="${exp.type}">
            <span class="expedition-icon">${emoji}</span>
            <div class="expedition-info">
                <span class="expedition-name">${escapeHTML(exp.name)}</span>
                <span class="expedition-type-badge">${typeName}</span>
            </div>
        </div>
    `;
}

export function initExpeditionDropdown() {
    const searchInput = document.getElementById('expeditionSearch');
    const dropdown = document.getElementById('expeditionDropdown');
    const hiddenInput = document.getElementById('selectedExpeditionId');
    const hiddenTypeInput = document.getElementById('selectedExpeditionType');
    
    if (!searchInput || !dropdown) return;

    ensureDropdownCloseHandler();

    const render = (filter = '') => renderExpeditionDropdownItems(dropdown, filter);

    searchInput.addEventListener('focus', () => {
        render('');
        dropdown.classList.add('show');
    });

    searchInput.addEventListener('input', (event) => {
        render(event.target.value);
        dropdown.classList.add('show');
    });

    dropdown.addEventListener('click', (event) => {
        const item = event.target.closest('.dropdown-item');
        if (!item) return;
        
        const expeditionId = Number(item.dataset.expeditionId);
        const expeditionType = item.dataset.expeditionType;
        
        selectExpedition(expeditionId, expeditionType);
        dropdown.classList.remove('show');
    });
}

export function selectExpedition(expeditionId, expeditionType) {
    const expedition = getExpeditionById(expeditionId);
    if (!expedition) return;
    
    const searchInput = document.getElementById('expeditionSearch');
    const hiddenIdInput = document.getElementById('selectedExpeditionId');
    const hiddenTypeInput = document.getElementById('selectedExpeditionType');
    const infoDiv = document.getElementById('expeditionInfo');
    
    const emoji = EXPEDITION_CONSTANTS.LOCATION_EMOJIS[expedition.type] || '📍';
    
    if (searchInput) searchInput.value = `${emoji} ${expedition.name}`;
    if (hiddenIdInput) hiddenIdInput.value = String(expeditionId);
    if (hiddenTypeInput) hiddenTypeInput.value = expedition.type;
    
    updateExpeditionInfo(expedition);
}

export function updateExpeditionInfo(expedition) {
    const infoDiv = document.getElementById('expeditionInfo');
    if (!infoDiv) return;
    
    const weights = EXPEDITION_CONSTANTS.LOCATION_REWARD_WEIGHTS[expedition.type];
    const typeName = LOCATION_NAMES[expedition.type] || expedition.type;
    const typeDesc = LOCATION_DESCRIPTIONS[expedition.type] || '';
    
    const formatWeight = (value, label) => {
        const colorClass = value > 1 ? 'bonus-positive' : value < 1 ? 'bonus-negative' : 'bonus-neutral';
        return `<span class="${colorClass}">${label} ×${value}</span>`;
    };
    
    infoDiv.innerHTML = `
        <div class="expedition-details">
            <div class="expedition-type-info">
                <strong>Type:</strong> ${typeName}
                <span class="expedition-type-desc">${typeDesc}</span>
            </div>
            <div class="expedition-bonuses">
                <strong>Multiplicateurs:</strong>
                <div class="bonus-grid">
                    ${formatWeight(weights.money, '💰 Argent')}
                    ${formatWeight(weights.experience, '⭐ XP')}
                    ${formatWeight(weights.points, '🏅 Points')}
                </div>
            </div>
            ${expedition.description ? `<div class="expedition-description"><em>${escapeHTML(expedition.description)}</em></div>` : ''}
        </div>
    `;
    infoDiv.style.display = 'block';
}

export function getSelectedExpedition() {
    const hiddenInput = document.getElementById('selectedExpeditionId');
    const typeInput = document.getElementById('selectedExpeditionType');
    return {
        id: hiddenInput ? parseInt(hiddenInput.value, 10) : null,
        type: typeInput ? typeInput.value : 'plains'
    };
}

// === Analyzer Expedition Dropdown ===

export function initAnalyzerExpeditionDropdown() {
    const searchInput = document.getElementById('analyzerExpeditionSearch');
    const dropdown = document.getElementById('analyzerExpeditionDropdown');
    
    if (!searchInput || !dropdown) return;

    ensureDropdownCloseHandler();

    const render = (filter = '') => renderExpeditionDropdownItems(dropdown, filter);

    searchInput.addEventListener('focus', () => {
        render('');
        dropdown.classList.add('show');
    });

    searchInput.addEventListener('input', (event) => {
        render(event.target.value);
        dropdown.classList.add('show');
    });

    dropdown.addEventListener('click', (event) => {
        const item = event.target.closest('.dropdown-item');
        if (!item) return;
        
        const expeditionId = Number(item.dataset.expeditionId);
        const expeditionType = item.dataset.expeditionType;
        
        selectAnalyzerExpedition(expeditionId, expeditionType);
        dropdown.classList.remove('show');
    });
}

export function selectAnalyzerExpedition(expeditionId, expeditionType) {
    const expedition = getExpeditionById(expeditionId);
    if (!expedition) return;
    
    const searchInput = document.getElementById('analyzerExpeditionSearch');
    const hiddenIdInput = document.getElementById('analyzerSelectedExpeditionId');
    const hiddenTypeInput = document.getElementById('analyzerSelectedExpeditionType');
    const infoDiv = document.getElementById('analyzerExpeditionInfo');
    
    const emoji = EXPEDITION_CONSTANTS.LOCATION_EMOJIS[expedition.type] || '📍';
    
    if (searchInput) searchInput.value = `${emoji} ${expedition.name}`;
    if (hiddenIdInput) hiddenIdInput.value = String(expeditionId);
    if (hiddenTypeInput) hiddenTypeInput.value = expedition.type;
    
    updateAnalyzerExpeditionInfo(expedition);
}

export function updateAnalyzerExpeditionInfo(expedition) {
    const infoDiv = document.getElementById('analyzerExpeditionInfo');
    if (!infoDiv) return;
    
    const weights = EXPEDITION_CONSTANTS.LOCATION_REWARD_WEIGHTS[expedition.type];
    const typeName = LOCATION_NAMES[expedition.type] || expedition.type;
    const typeDesc = LOCATION_DESCRIPTIONS[expedition.type] || '';
    
    const formatWeight = (value, label) => {
        const colorClass = value > 1 ? 'bonus-positive' : value < 1 ? 'bonus-negative' : 'bonus-neutral';
        return `<span class="${colorClass}">${label} ×${value}</span>`;
    };
    
    infoDiv.innerHTML = `
        <div class="expedition-details">
            <div class="expedition-type-info">
                <strong>Type:</strong> ${typeName}
                <span class="expedition-type-desc">${typeDesc}</span>
            </div>
            <div class="expedition-bonuses">
                <strong>Multiplicateurs:</strong>
                <div class="bonus-grid">
                    ${formatWeight(weights.money, '💰 Argent')}
                    ${formatWeight(weights.experience, '⭐ XP')}
                    ${formatWeight(weights.points, '🏅 Points')}
                </div>
            </div>
            ${expedition.description ? `<div class="expedition-description"><em>${escapeHTML(expedition.description)}</em></div>` : ''}
        </div>
    `;
    infoDiv.style.display = 'block';
}

export function getAnalyzerSelectedExpedition() {
    const hiddenInput = document.getElementById('analyzerSelectedExpeditionId');
    const typeInput = document.getElementById('analyzerSelectedExpeditionType');
    return {
        id: hiddenInput ? parseInt(hiddenInput.value, 10) : null,
        type: typeInput ? typeInput.value : 'plains'
    };
}

export function initAnalyzerSliders() {
    const loveSlider = document.getElementById('analyzerLovePoints');
    const loveValue = document.getElementById('analyzerLoveValue');
    const loveHint = document.getElementById('analyzerLoveMinHint');
    
    if (loveSlider && loveValue) {
        const update = () => {
            const val = parseInt(loveSlider.value, 10);
            loveValue.textContent = val;
            // Afficher le message uniquement quand 80 points sont sélectionnés
            if (loveHint) {
                loveHint.style.display = val === 80 ? 'block' : 'none';
            }
        };
        loveSlider.addEventListener('input', update);
        update();
    }
}

/**
 * Gère l'exclusivité mutuelle entre bonus talisman et bonus tokens
 * (Un seul bonus peut être actif à la fois sur une expédition)
 */
export function initBonusExclusivity() {
    // Simulateur
    const talismanBonus = document.getElementById('hasTalismanBonus');
    const tokenBonus = document.getElementById('hasTokenBonus');
    
    if (talismanBonus && tokenBonus) {
        talismanBonus.addEventListener('change', () => {
            if (talismanBonus.checked) {
                tokenBonus.checked = false;
            }
        });
        
        tokenBonus.addEventListener('change', () => {
            if (tokenBonus.checked) {
                talismanBonus.checked = false;
            }
        });
    }
    
    // Analyseur
    const analyzerTalismanBonus = document.getElementById('analyzerTalismanBonus');
    const analyzerTokenBonus = document.getElementById('analyzerTokenBonus');
    
    if (analyzerTalismanBonus && analyzerTokenBonus) {
        analyzerTalismanBonus.addEventListener('change', () => {
            if (analyzerTalismanBonus.checked) {
                analyzerTokenBonus.checked = false;
            }
        });
        
        analyzerTokenBonus.addEventListener('change', () => {
            if (analyzerTokenBonus.checked) {
                analyzerTalismanBonus.checked = false;
            }
        });
    }
}

let cachedBranches = [];

function renderBranchDropdownItems(dropdown, filter) {
    const normalizedFilter = normalizeString(filter || '');
    const branches = cachedBranches.filter(branch => normalizeString(branch).includes(normalizedFilter));
    dropdown.innerHTML = branches.map(branch => `
        <div class="dropdown-item" data-branch="${escapeHTML(branch)}">
            <span class="pet-name">${escapeHTML(branch)}</span>
        </div>
    `).join('');
}

function selectBranch(branchName) {
    const searchInput = document.getElementById('branchSearch');
    const hiddenInput = document.getElementById('selectedBranch');
    
    if (searchInput) searchInput.value = branchName;
    if (hiddenInput) hiddenInput.value = branchName;
}

export async function initBranchSelect() {
    const searchInput = document.getElementById('branchSearch');
    const dropdown = document.getElementById('branchDropdown');
    const hiddenInput = document.getElementById('selectedBranch');
    
    if (!searchInput || !dropdown) return;

    ensureDropdownCloseHandler();

    try {
        cachedBranches = await fetchGitHubBranches();
        
        // Définir la branche par défaut
        const defaultBranch = 'master';
        if (cachedBranches.includes(defaultBranch)) {
            selectBranch(defaultBranch);
        } else if (cachedBranches.length > 0) {
            selectBranch(cachedBranches[0]);
        }
        
        console.log(`✅ ${cachedBranches.length} branches chargées`);
    } catch (error) {
        console.error('Erreur lors du chargement des branches:', error);
        showToast('⚠️ Impossible de charger les branches depuis GitHub');
        // Fallback sur quelques branches communes
        cachedBranches = ['master', 'develop', 'petexploration'];
        selectBranch('develop');
    }

    const render = (filter = '') => renderBranchDropdownItems(dropdown, filter);

    searchInput.addEventListener('focus', () => {
        render('');
        dropdown.classList.add('show');
    });

    searchInput.addEventListener('input', (event) => {
        render(event.target.value);
        dropdown.classList.add('show');
    });

    dropdown.addEventListener('click', (event) => {
        const item = event.target.closest('.dropdown-item');
        if (!item) return;
        const branchName = item.dataset.branch;
        selectBranch(branchName);
        dropdown.classList.remove('show');
    });
}

export function showToast(message = '✅ Résultats calculés !') {
    const toast = document.getElementById('toast');
    if (!toast) return;
    toast.textContent = message;
    toast.classList.add('show');
    setTimeout(() => toast.classList.remove('show'), 3000);
}
