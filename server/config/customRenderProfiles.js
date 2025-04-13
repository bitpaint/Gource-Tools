/**
 * Profils de rendu personnalisés pour Gource
 * Ce fichier définit des profils supplémentaires pour des rendus spécifiques
 * comme la dernière semaine, le dernier mois ou la dernière année
 */
const { defaultSettings } = require('./defaultGourceConfig');

// Profil pour visualiser la dernière semaine en 30 secondes
const lastWeekProfile = {
  id: 'last_week_30s',
  name: 'Last Week - 30 seconds',
  description: 'Visualisation condensée de l\'activité de la dernière semaine en 30 secondes',
  isDefault: false,
  settings: {
    ...defaultSettings,
    secondsPerDay: 4.3, // 30 secondes / 7 jours = ~4.3 secondes par jour
    autoSkipSeconds: 0.1,
    maxFilelag: 0.15,
    userScale: 1.2, // Légèrement plus grand pour mettre en évidence les utilisateurs
    timeScale: 1.2,
    highlightUsers: true,
    extraArgs: '--start-date $(date -d "7 days ago" "+%Y-%m-%d") --stop-date $(date "+%Y-%m-%d") --date-format "%d %b" --highlight-all-users'
  },
  dateCreated: new Date().toISOString(),
  lastModified: new Date().toISOString()
};

// Profil pour visualiser le dernier mois en 1 minute
const lastMonthProfile = {
  id: 'last_month_1m',
  name: 'Last Month - 1 minute',
  description: 'Visualisation condensée de l\'activité du dernier mois en 1 minute',
  isDefault: false,
  settings: {
    ...defaultSettings,
    secondsPerDay: 2, // 60 secondes / 30 jours = 2 secondes par jour
    autoSkipSeconds: 0.2,
    maxFilelag: 0.2,
    userScale: 1.1,
    timeScale: 1.2,
    highlightUsers: true,
    extraArgs: '--start-date $(date -d "30 days ago" "+%Y-%m-%d") --stop-date $(date "+%Y-%m-%d") --date-format "%d %b"'
  },
  dateCreated: new Date().toISOString(),
  lastModified: new Date().toISOString()
};

// Profil pour visualiser la dernière année en 1 minute
const lastYearProfile = {
  id: 'last_year_1m',
  name: 'Last Year - 1 minute',
  description: 'Visualisation condensée de l\'activité de l\'année entière en 1 minute',
  isDefault: false,
  settings: {
    ...defaultSettings,
    secondsPerDay: 0.17, // 60 secondes / 365 jours = ~0.17 secondes par jour
    autoSkipSeconds: 0.5,
    maxFilelag: 0.3,
    timeScale: 1.5, // Accentuer l'échelle du temps pour mieux voir la progression
    elasticity: 0.4,
    highlightUsers: false, // Désactivé pour éviter la surcharge visuelle sur 1 an
    extraArgs: '--start-date $(date -d "365 days ago" "+%Y-%m-%d") --stop-date $(date "+%Y-%m-%d") --date-format "%b %Y"'
  },
  dateCreated: new Date().toISOString(),
  lastModified: new Date().toISOString()
};

// Liste des profils personnalisés
const customProfiles = [
  lastWeekProfile,
  lastMonthProfile,
  lastYearProfile
];

module.exports = {
  customProfiles,
  lastWeekProfile,
  lastMonthProfile,
  lastYearProfile
}; 