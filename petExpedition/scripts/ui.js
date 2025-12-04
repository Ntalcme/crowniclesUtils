// ui.js - Gestion des interactions d'interface
import { getPets, getPetById } from './state.js';
import { EXPEDITION_CONSTANTS, RARITY_NAMES } from './constants.js';
import { formatDuration, getCategoryName, escapeHTML, normalizeString } from './utils.js';

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
    if (loveSlider && loveValue) {
        loveSlider.addEventListener('input', () => {
            loveValue.textContent = loveSlider.value;
        });
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

    initLocationGrid();
}

export function initAnalyzerSliders() {
    const loveSlider = document.getElementById('analyzerLovePoints');
    const loveValue = document.getElementById('analyzerLoveValue');
    if (loveSlider && loveValue) {
        const update = () => { loveValue.textContent = loveSlider.value; };
        loveSlider.addEventListener('input', update);
        update();
    }
}

export function initLocationGrid() {
    const grid = document.getElementById('locationGrid');
    if (!grid) return;

    const options = grid.querySelectorAll('.location-option');
    options.forEach(option => {
        option.addEventListener('click', () => {
            options.forEach(opt => opt.classList.remove('selected'));
            option.classList.add('selected');
            updateLocationInfo(option.dataset.location);
        });
    });

    updateLocationInfo(getSelectedLocation());
}

export function updateLocationInfo(location) {
    const infoEl = document.getElementById('locationInfo');
    const weights = EXPEDITION_CONSTANTS.LOCATION_REWARD_WEIGHTS[location];
    if (!infoEl || !weights) return;

    const formatWeight = (value) => {
        if (value > 1) return `<span style="color: var(--success)">×${value}</span>`;
        if (value < 1) return `<span style="color: var(--danger)">×${value}</span>`;
        return `×${value}`;
    };

    infoEl.innerHTML = `Bonus: Argent ${formatWeight(weights.money)}, XP ${formatWeight(weights.experience)}, Points ${formatWeight(weights.points)}`;
}

export function getSelectedLocation() {
    const selected = document.querySelector('.location-option.selected');
    return selected ? selected.dataset.location : 'plains';
}

export function showToast(message = '✅ Résultats calculés !') {
    const toast = document.getElementById('toast');
    if (!toast) return;
    toast.textContent = message;
    toast.classList.add('show');
    setTimeout(() => toast.classList.remove('show'), 3000);
}
