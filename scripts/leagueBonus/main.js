import { LEAGUE_NAMES, LEAGUE_EMOJIS } from './constants.js';
import { calculateRewards } from './calculation.js';

const { createApp, ref } = Vue;

createApp({
    setup() {
        const selectedLeague = ref('wood');
        const rank = ref(1);
        const rewards = ref(null);

        function calculate() {
            rewards.value = calculateRewards(selectedLeague.value, rank.value);
        }

        return {
            selectedLeague,
            rank,
            rewards,
            LEAGUE_NAMES,
            LEAGUE_EMOJIS,
            calculate
        };
    }
}).mount('#app');
