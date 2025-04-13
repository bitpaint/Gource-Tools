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
    'seconds-per-day': 4.3, // 30 secondes / 7 jours = ~4.3 secondes par jour
    'auto-skip-seconds': 0.1,
    'max-file-lag': 0.15,
    'user-scale': 1.2, // Légèrement plus grand pour mettre en évidence les utilisateurs
    'time-scale': 1.2,
    'highlight-users': true,
    'date-format': '%d %b',
    'highlight-all-users': true,
    'range-days': 7, // Nombre de jours à visualiser (sera utilisé pour calculer start-date)
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
    'seconds-per-day': 2, // 60 secondes / 30 jours = 2 secondes par jour
    'auto-skip-seconds': 0.2,
    'max-file-lag': 0.2,
    'user-scale': 1.1,
    'time-scale': 1.2,
    'highlight-users': true,
    'date-format': '%d %b',
    'range-days': 30, // Nombre de jours à visualiser (sera utilisé pour calculer start-date)
  },
  dateCreated: new Date().toISOString(),
  lastModified: new Date().toISOString()
};

// Profil pour visualiser la dernière année en 3 minutes
const lastYearProfile = {
  id: 'last_year_3m',
  name: 'Last Year - 3 minutes',
  description: 'Visualisation condensée de l\'activité de la dernière année en 3 minutes',
  isDefault: false,
  settings: {
    ...defaultSettings,
    'seconds-per-day': 0.5, // 180 secondes / 365 jours ~= 0.5 secondes par jour
    'auto-skip-seconds': 0.5,
    'max-file-lag': 0.3,
    'user-scale': 1.0,
    'time-scale': 1.5,
    'highlight-users': true,
    'date-format': '%b %Y',
    'range-days': 365, // Nombre de jours à visualiser (sera utilisé pour calculer start-date)
  },
  dateCreated: new Date().toISOString(),
  lastModified: new Date().toISOString()
};

// Exporter tous les profils personnalisés
const customRenderProfiles = [
  lastWeekProfile,
  lastMonthProfile,
  lastYearProfile
];

module.exports = {
  customRenderProfiles
}; 