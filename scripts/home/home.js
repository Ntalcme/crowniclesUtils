// home/home.js
const { createApp } = Vue;

const toolsConfig = [
  {
    id: 'petExpedition',
    title: 'Expéditions de Familiers',
    icon: "🐾",
    description: 'Optimisez les expéditions de vos familiers : comparez les lieux, calculez les gains, analysez les probabilités.',
    path: 'views/petExpedition/home.html',
    status: 'active'
  },
  {
    id: 'leagueBonus',
    title: 'Bonus de ligue',
    icon: "🏆",
    description: 'Calculez vos récompenses selon votre ligue et votre position dans le classement.',
    path: 'views/leagueBonus/home.html',
    status: 'active'
  }
];


createApp({
  data() {
    return {
      tools: toolsConfig,
      search: ''
    };
  },
  computed: {
    filteredTools() {
      return this.tools.filter(tool =>
        tool.title.toLowerCase().includes(this.search.toLowerCase())
      );
    }
  },
  methods: {
    displayStatus(status) {
      switch (status) {
        case 'active': return 'Actif';
        case 'obsolete': return 'Obsolète';
        default: return status;
      }
    }
  }
}).mount('#app');
