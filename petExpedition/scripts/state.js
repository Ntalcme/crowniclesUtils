// state.js - Gestion de l'état global des données
const state = {
    pets: [],
    translations: {},
    mapLocations: {},
    mapTypes: {},
    expeditions: [],
    petPreferences: {}  // Préférences d'expédition par type de familier
};

export function setPets(pets) {
    state.pets = pets;
}

export function getPets() {
    return state.pets;
}

export function setTranslations(translations) {
    state.translations = translations;
}

export function getTranslations() {
    return state.translations;
}

export function setMapLocations(mapLocations) {
    state.mapLocations = mapLocations;
}

export function getMapLocations() {
    return state.mapLocations;
}

export function setMapTypes(mapTypes) {
    state.mapTypes = mapTypes;
}

export function getMapTypes() {
    return state.mapTypes;
}

export function setExpeditions(expeditions) {
    state.expeditions = expeditions;
}

export function getExpeditions() {
    return state.expeditions;
}

export function getPetById(id) {
    return state.pets.find(pet => pet.id === id) || null;
}

export function getExpeditionById(id) {
    return state.expeditions.find(exp => exp.id === id) || null;
}

export function setPetPreferences(preferences) {
    state.petPreferences = preferences;
}

export function getPetPreferences() {
    return state.petPreferences;
}

/**
 * Récupère la préférence d'un familier pour un type de lieu
 * @param {number} petTypeId - ID du type de familier
 * @param {string} locationType - Type de lieu (forest, mountain, etc.)
 * @returns {'liked'|'neutral'|'disliked'} La préférence du familier
 */
export function getPetExpeditionPreference(petTypeId, locationType) {
    const prefs = state.petPreferences[petTypeId];
    if (!prefs) return 'neutral';
    
    if (prefs.liked && prefs.liked.includes(locationType)) return 'liked';
    if (prefs.disliked && prefs.disliked.includes(locationType)) return 'disliked';
    return 'neutral';
}

/**
 * Récupère les préférences d'un familier
 * @param {number} petTypeId - ID du type de familier
 * @returns {object|null} { liked: string[], disliked: string[] }
 */
export function getPetPreferencesById(petTypeId) {
    return state.petPreferences[petTypeId] || null;
}
