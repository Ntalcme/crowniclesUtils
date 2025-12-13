// state.js - Gestion de l'état global des données
const state = {
    pets: [],
    translations: {},
    mapLocations: {},
    mapTypes: {},
    expeditions: []
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
