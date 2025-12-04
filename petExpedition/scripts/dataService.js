// dataService.js - Chargement des données distantes
import { setPets, setTranslations } from './state.js';

async function fetchJson(url, errorMessage) {
    const response = await fetch(url);
    if (!response.ok) {
        throw new Error(errorMessage || `Impossible de charger ${url}`);
    }
    return response.json();
}

export async function fetchPetData(branch) {
    const translationsUrl = `https://raw.githubusercontent.com/Crownicles/Crownicles/${branch}/Lang/fr/models.json`;
    const translationsData = await fetchJson(translationsUrl, 'Impossible de charger les traductions');
    const translations = translationsData.pets || {};
    setTranslations(translations);

    const petPromises = [];
    for (let i = 0; i <= 101; i++) {
        const petUrl = `https://raw.githubusercontent.com/Crownicles/Crownicles/${branch}/Core/resources/pets/${i}.json`;
        const promise = fetch(petUrl)
            .then(res => (res.ok ? res.json() : null))
            .then(data => {
                if (data && data.rarity > 0) {
                    return {
                        id: i,
                        ...data,
                        name: translations[`${i}_male`] || `Pet #${i}`
                    };
                }
                return null;
            })
            .catch(() => null);
        petPromises.push(promise);
    }

    const rawPets = await Promise.all(petPromises);
    const pets = rawPets.filter(Boolean).sort((a, b) => a.name.localeCompare(b.name, 'fr'));
    setPets(pets);

    return { pets, translations };
}
