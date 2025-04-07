/**
 * Script pour démarrer le projet en mode développement
 */

const concurrently = require('concurrently');
const path = require('path');

// Démarrer le client et le serveur en parallèle
const { result } = concurrently([
  {
    command: 'cd client && npm start',
    name: 'CLIENT',
    prefixColor: 'blue',
  },
  {
    command: 'cd server && npm run dev',
    name: 'SERVER',
    prefixColor: 'green',
  }
], {
  prefix: 'name',
  killOthers: ['failure', 'success'],
  restartTries: 3,
});

result.then(
  () => console.log('Tous les processus se sont terminés avec succès'),
  (error) => console.error('Un ou plusieurs processus ont échoué:', error)
); 