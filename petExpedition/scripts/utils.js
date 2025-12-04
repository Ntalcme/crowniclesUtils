// utils.js - Fonctions utilitaires génériques
export function formatDuration(minutes) {
    if (minutes < 60) return `${minutes}min`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours < 24) return mins > 0 ? `${hours}h${mins}min` : `${hours}h`;
    const days = Math.floor(hours / 24);
    const remainingHours = hours % 24;
    return remainingHours > 0 ? `${days}j ${remainingHours}h` : `${days}j`;
}

export function getCategoryName(value, categories) {
    for (const category of categories) {
        if (value <= category.max) return category.name;
    }
    return categories.length ? categories[categories.length - 1].name : '';
}

export function getIntervalValue(min, max, percentage) {
    const clamped = Math.max(0, Math.min(1, percentage));
    return min + (max - min) * clamped;
}

export function calculateLinearScore(value, min, max) {
    const percentage = (value - min) / (max - min);
    return getIntervalValue(0, 3, percentage);
}

/**
 * Échappe les caractères HTML pour prévenir les injections XSS
 * @param {string} str - Chaîne à échapper
 * @returns {string} Chaîne échappée
 */
export function escapeHTML(str) {
    return String(str || '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

/**
 * Définit du contenu HTML de manière sécurisée
 * @param {HTMLElement} container - Élément conteneur
 * @param {string} htmlString - HTML à insérer
 * @param {Object} options - Options { escapeValues: boolean }
 */
export function safeSetHTML(container, htmlString, { escapeValues = false } = {}) {
    if (escapeValues) {
        container.textContent = htmlString;
    } else {
        container.innerHTML = htmlString;
    }
}

/**
 * Normalise une chaîne en supprimant les accents pour faciliter la recherche
 * @param {string} str - Chaîne à normaliser
 * @returns {string} Chaîne normalisée sans accents
 */
export function normalizeString(str) {
    return String(str || '')
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLowerCase();
}
