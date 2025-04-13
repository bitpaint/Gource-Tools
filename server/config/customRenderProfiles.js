/**
 * Profils de rendu personnalisés pour Gource
 * Ce fichier définit des profils supplémentaires pour des rendus spécifiques
 * comme la dernière semaine, le dernier mois ou la dernière année
 */
const { defaultSettings } = require('./defaultGourceConfig');

// Profil pour visualiser la dernière semaine en 1 minute
const lastWeekProfile = {
  id: 'last_week_1m',
  name: 'Last week: 1 min',
  description: '1 minute visualization of the last week activity',
  isDefault: false,
  settings: {
    ...defaultSettings,
    'resolution': '1920x1080',
    'framerate': 30,
    'seconds-per-day': 8.57, // 60 secondes / 7 jours = ~8.57 secondes par jour
    'auto-skip-seconds': 0.1,
    'max-file-lag': 0.15,
    'elasticity': 0.3,
    'title': true,
    'key': true,
    'background': '#000000',
    'font-scale': 1.5,
    'camera-mode': 'overview',
    'user-scale': 1.2,
    'time-scale': 1.2,
    'highlight-users': true,
    'hide-root': true,
    'title-text': ' ',
    'show-dates': true,
    'disable-progress': true,
    'show-files': true,
    'multi-sampling': true,
    'date-format': '%d %b',
    'range-days': 7, // Nombre de jours à visualiser
    'extra-args': '--padding 1.3 -a 0.5 --hide mouse,filenames,progress --file-idle-time 0 --filename-time 2.0 --user-font-size 20'
  },
  dateCreated: new Date().toISOString(),
  lastModified: new Date().toISOString()
};

// Profil pour visualiser le dernier mois en 1 minute
const lastMonthProfile = {
  id: 'last_month_1m',
  name: 'Last month: 1 min',
  description: '1 minute visualization of the last month activity',
  isDefault: false,
  settings: {
    ...defaultSettings,
    'resolution': '1920x1080',
    'framerate': 30,
    'seconds-per-day': 2, // 60 secondes / 30 jours = 2 secondes par jour
    'auto-skip-seconds': 0.2,
    'max-file-lag': 0.2,
    'elasticity': 0.3,
    'title': true,
    'key': true,
    'background': '#000000',
    'font-scale': 1.5,
    'camera-mode': 'overview',
    'user-scale': 1.1,
    'time-scale': 1.2,
    'highlight-users': true,
    'hide-root': true,
    'title-text': ' ',
    'show-dates': true,
    'disable-progress': true,
    'show-files': true,
    'multi-sampling': true,
    'date-format': '%d %b',
    'range-days': 30, // Nombre de jours à visualiser
    'extra-args': '--padding 1.3 -a 0.5 --hide mouse,filenames,progress --file-idle-time 0 --filename-time 2.0 --user-font-size 20'
  },
  dateCreated: new Date().toISOString(),
  lastModified: new Date().toISOString()
};

// Profil pour visualiser la dernière année en 1 minute
const lastYearProfile = {
  id: 'last_year_1m',
  name: 'Last year: 1 min',
  description: '1 minute visualization of the last year activity',
  isDefault: false,
  settings: {
    ...defaultSettings,
    'resolution': '1920x1080',
    'framerate': 30,
    'seconds-per-day': 0.167, // 60 secondes / 365 jours ~= 0.167 secondes par jour
    'auto-skip-seconds': 0.5,
    'max-file-lag': 0.3,
    'elasticity': 0.3,
    'title': true,
    'key': true,
    'background': '#000000',
    'font-scale': 1.5,
    'camera-mode': 'overview',
    'user-scale': 1.0,
    'time-scale': 1.5,
    'highlight-users': true,
    'hide-root': true,
    'title-text': ' ',
    'show-dates': true,
    'disable-progress': true,
    'show-files': true,
    'multi-sampling': true,
    'date-format': '%b %Y',
    'range-days': 365, // Nombre de jours à visualiser
    'extra-args': '--padding 1.3 -a 0.5 --hide mouse,filenames,progress --file-idle-time 0 --filename-time 2.0 --user-font-size 20'
  },
  dateCreated: new Date().toISOString(),
  lastModified: new Date().toISOString()
};

// Profil pour visualiser tout le projet en 1 minute
const everythingProfile = {
  id: 'everything_1m',
  name: 'Everything in 1min',
  description: '1 minute visualization of the entire project history',
  isDefault: true,
  settings: {
    ...defaultSettings,
    'resolution': '1920x1080',
    'framerate': 30,
    'seconds-per-day': 'auto', // Cette valeur sera calculée dynamiquement
    'auto-skip-seconds': 0.5,
    'max-file-lag': 0.3,
    'elasticity': 0.3,
    'title': true,
    'key': true,
    'background': '#000000',
    'font-scale': 1.5,
    'camera-mode': 'overview',
    'user-scale': 1.0,
    'time-scale': 1.5,
    'highlight-users': true,
    'hide-root': true,
    'title-text': ' ',
    'show-dates': true,
    'disable-progress': true,
    'show-files': true,
    'multi-sampling': true,
    'date-format': '%b %Y',
    'range-days': 'all', // Tous les jours du projet
    'extra-args': '--padding 1.3 -a 0.5 --hide mouse,filenames,progress --file-idle-time 0 --filename-time 2.0 --user-font-size 20'
  },
  dateCreated: new Date().toISOString(),
  lastModified: new Date().toISOString(),
  // Indique que ce profil nécessite un calcul dynamique du seconds-per-day
  // basé sur la durée totale du projet (premier commit à dernier commit)
  dynamicTimeCalculation: true
};

// Exporter tous les profils personnalisés
const customRenderProfiles = [
  lastWeekProfile,
  lastMonthProfile,
  lastYearProfile,
  everythingProfile
];

module.exports = {
  customRenderProfiles
}; 