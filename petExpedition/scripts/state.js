// state.js - Gestion de l'état global des données
const state = {
    pets: [],
    translations: {}
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

export function getPetById(id) {
    return state.pets.find(pet => pet.id === id) || null;
}
