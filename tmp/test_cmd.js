// Script pour tester la génération des arguments Gource
const path = require('path');
const { convertToGourceArgs } = require('../shared/gourceConfig.js');
const { customRenderProfiles } = require('../server/config/customRenderProfiles.js');

// Obtenir le profil Last month
const lastMonthProfile = customRenderProfiles.find(profile => profile.id === 'last_month_1m');

if (!lastMonthProfile) {
  console.error('Profil "Last month" non trouvé!');
  process.exit(1);
}

console.log('Profil "Last month" chargé:');
console.log(JSON.stringify(lastMonthProfile, null, 2));

// Normaliser les paramètres pour s'assurer que les dates sont au bon format
const settings = { ...lastMonthProfile.settings };

// Convertir les paramètres en arguments Gource
console.log('\nArguments Gource générés:');
const gourceArgs = convertToGourceArgs(settings);
console.log(gourceArgs);

// Vérifier spécifiquement si start-date et stop-date sont présents dans les arguments
console.log('\nVérification des paramètres de date:');
if (gourceArgs.includes('--start-date')) {
  console.log('✅ Le paramètre --start-date est présent dans les arguments.');
} else {
  console.log('❌ Le paramètre --start-date n\'est PAS présent dans les arguments!');
}

if (gourceArgs.includes('--stop-date')) {
  console.log('✅ Le paramètre --stop-date est présent dans les arguments.');
} else {
  console.log('❌ Le paramètre --stop-date n\'est PAS présent dans les arguments!');
}

// Afficher les paramètres de date bruts pour vérification
console.log('\nParamètres de date bruts dans le profil:');
console.log('start-date:', settings['start-date']);
console.log('stop-date:', settings['stop-date']); 