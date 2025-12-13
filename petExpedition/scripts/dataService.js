// dataService.js - Chargement des données distantes
import { setPets, setTranslations, setMapLocations, setMapTypes, setExpeditions } from './state.js';
import { EXPEDITION_CONSTANTS } from './constants.js';

const CACHE_KEY = 'crownicles_pets_cache';
const CACHE_DURATION = 30 * 60 * 1000; // 30 minutes
const BRANCHES_CACHE_KEY = 'crownicles_branches_cache';
const BRANCHES_CACHE_DURATION = 60 * 60 * 1000; // 1 heure

// Mapping des types de carte vers les types d'expédition (depuis ExpeditionConstants.ts)
const MAP_TYPE_TO_EXPEDITION = {
    fo: "forest",
    mo: "mountain", 
    de: "desert",
    ruins: "ruins",
    be: "coast",
    ri: "coast",
    la: "swamp",
    pl: "plains",
    ro: "plains",
    vi: "plains",
    ci: "cave",
    castleEntrance: "ruins",
    castleThrone: "ruins",
    continent: "plains",
    iceBeach: "coast",
    tundra: "mountain",
    crystalCavern: "cave",
    mine: "cave",
    volcano: "mountain",
    blessedDoors: "ruins",
    icePeak: "mountain",
    undergroundLake: "swamp",
    dragonsNest: "cave",
    hauntedHouse: "ruins"
};

// Données officielles des expéditions depuis commands.json mapLocationExpeditions
// Format: { id: { name: "nom expédition", mapType: "type carte", expeditionType: "type expé override" } }
const EXPEDITION_DATA = {
    1:  { name: "les Récifs Mystérieux de la Plage Sentinelle", mapType: "be" },
    2:  { name: "les Sentiers Secrets de la Voie Champêtre", mapType: "ro" },
    3:  { name: "les Prairies Cachées du Berceau", mapType: "pl" },
    4:  { name: "les Profondeurs de la Forêt du Vieillard", mapType: "fo" },
    5:  { name: "les Labyrinthes Oubliés du Chemin du Dédale", mapType: "ro", expeditionType: "ruins" },
    6:  { name: "les Caves Secrètes de Boug-Coton", mapType: "vi", expeditionType: "cave" },
    7:  { name: "les Tombeaux Oubliés de la Vallée des Rois", mapType: "de", expeditionType: "ruins" },
    8:  { name: "les Passages Mystiques du Croisement des Destins", mapType: "ro" },
    9:  { name: "les Pavés Anciens de la Grande Rue", mapType: "ro" },
    10: { name: "les Catacombes Perdues de Ville Forte", mapType: "vi", expeditionType: "ruins" },
    11: { name: "les Embuscades du Grand Axe", mapType: "ro" },
    12: { name: "les Plaines de l'Étendue", mapType: "pl" },
    13: { name: "les Marécages Maudits de la Route Marécageuse", mapType: "ro", expeditionType: "swamp" },
    14: { name: "les Brumes Enchanteresses du Lac Mirage", mapType: "la" },
    15: { name: "les Sommets Enneigés du Mont Célestrum", mapType: "mo" },
    16: { name: "les Tanières du Chemin aux Loups", mapType: "ro", expeditionType: "forest" },
    17: { name: "les Oasis Cachées du Village Coco", mapType: "vi", expeditionType: "desert" },
    18: { name: "les Rapides Tumultueux de la Rivière Vacarme", mapType: "ri" },
    19: { name: "les Sables Mouvants de La Dune", mapType: "be", expeditionType: "desert" },
    20: { name: "les Champs Paisibles des Plaines du Contre Bois", mapType: "pl" },
    21: { name: "les Échoppes Abandonnées de la Route des Merveilles", mapType: "ro" },
    22: { name: "les Galeries Obscures du Bois Hurlant", mapType: "fo", expeditionType: "cave" },
    23: { name: "les Ruelles Secrètes de Claire de Ville", mapType: "ci", expeditionType: "plains" },
    24: { name: "les Escarpements de la Route Grimpante", mapType: "ro", expeditionType: "mountain" },
    25: { name: "les Méandres de la Rivière aux Crabes", mapType: "ri" },
    26: { name: "les Quartiers Anciens de Mergagnan", mapType: "ci", expeditionType: "plains" },
    27: { name: "les Clairières Mystiques de la Forêt Célestrum", mapType: "fo" },
    28: { name: "les Souterrains des Portes du Château", mapType: "castleEntrance" },
    29: { name: "les Alcôves de la Salle de Réception", mapType: "castleThrone" },
    32: { name: "les Pavés Royaux de la Route vers le Château", mapType: "ro" }
};

async function fetchJson(url, errorMessage) {
    const response = await fetch(url);
    if (!response.ok) {
        throw new Error(errorMessage || `Impossible de charger ${url}`);
    }
    return response.json();
}

export async function fetchGitHubBranches() {
    // Vérifier le cache
    const cached = localStorage.getItem(BRANCHES_CACHE_KEY);
    if (cached) {
        try {
            const { data, timestamp } = JSON.parse(cached);
            if (Date.now() - timestamp < BRANCHES_CACHE_DURATION) {
                console.log('✅ Branches chargées depuis le cache');
                return data;
            }
        } catch (e) {
            console.warn('Cache des branches corrompu, rechargement...', e);
            localStorage.removeItem(BRANCHES_CACHE_KEY);
        }
    }

    const branchesUrl = 'https://api.github.com/repos/Crownicles/Crownicles/branches';
    const branches = await fetchJson(branchesUrl, 'Impossible de charger les branches');
    const branchNames = branches.map(branch => branch.name).sort();

    // Sauvegarder dans le cache
    try {
        localStorage.setItem(BRANCHES_CACHE_KEY, JSON.stringify({
            data: branchNames,
            timestamp: Date.now()
        }));
        console.log('✅ Branches mises en cache');
    } catch (e) {
        console.warn('Impossible de sauvegarder le cache des branches', e);
    }

    return branchNames;
}

export async function fetchPetData(branch) {
    // Vérifier le cache
    const cacheKey = `${CACHE_KEY}_${branch}`;
    const cached = localStorage.getItem(cacheKey);
    if (cached) {
        try {
            const { data, timestamp } = JSON.parse(cached);
            if (Date.now() - timestamp < CACHE_DURATION) {
                console.log('✅ Données chargées depuis le cache');
                setPets(data.pets);
                setTranslations(data.translations);
                setMapLocations(data.mapLocations || {});
                setMapTypes(data.mapTypes || {});
                
                // Toujours reconstruire les expéditions depuis EXPEDITION_DATA
                // pour être sûr d'avoir les données à jour
                const expeditions = buildExpeditionsList(data.mapLocations, data.mapTypes);
                setExpeditions(expeditions);
                
                return { ...data, expeditions };
            }
        } catch (e) {
            console.warn('Cache corrompu, rechargement...', e);
            localStorage.removeItem(cacheKey);
        }
    }

    const translationsUrl = `https://raw.githubusercontent.com/Crownicles/Crownicles/${branch}/Lang/fr/models.json`;
    const translationsData = await fetchJson(translationsUrl, 'Impossible de charger les traductions');
    
    const translations = translationsData.pets || {};
    const mapLocations = translationsData.map_locations || {};
    const mapTypes = translationsData.map_types || {};
    
    setTranslations(translations);
    setMapLocations(mapLocations);
    setMapTypes(mapTypes);

    // Construire la liste des expéditions disponibles
    const expeditions = buildExpeditionsList(mapLocations, mapTypes);
    setExpeditions(expeditions);

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

    const result = { pets, translations, mapLocations, mapTypes, expeditions };

    // Sauvegarder dans le cache
    try {
        localStorage.setItem(cacheKey, JSON.stringify({
            data: result,
            timestamp: Date.now()
        }));
        console.log('✅ Données mises en cache');
    } catch (e) {
        console.warn('Impossible de sauvegarder le cache', e);
    }

    return result;
}

/**
 * Construit la liste des expéditions avec leurs noms, types et émojis
 * Utilise les données officielles de mapLocationExpeditions
 */
function buildExpeditionsList(mapLocations, mapTypes) {
    const expeditions = [];
    
    for (const [idStr, data] of Object.entries(EXPEDITION_DATA)) {
        const id = parseInt(idStr);
        
        // Déterminer le type d'expédition
        // Si expeditionType est défini, l'utiliser, sinon utiliser le mapping du mapType
        const expeditionType = data.expeditionType || MAP_TYPE_TO_EXPEDITION[data.mapType] || 'plains';
        
        expeditions.push({
            id: id,
            name: data.name,
            description: '',
            particle: 'vers',
            type: expeditionType,
            mapType: data.mapType,
            emoji: EXPEDITION_CONSTANTS.LOCATION_EMOJIS[expeditionType] || '📍'
        });
    }
    
    // Trier par nom
    return expeditions.sort((a, b) => a.name.localeCompare(b.name, 'fr'));
}
