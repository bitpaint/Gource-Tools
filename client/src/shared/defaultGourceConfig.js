/**
 * Default Gource configuration file
 * Used for all projects when no specific configuration is selected
 * This file serves as the single source of truth for default Gource settings
 * and is used by both the client and server.
 */

// Default settings for Gource
const defaultSettings = {
  resolution: '1920x1080',
  framerate: 60,
  secondsPerDay: 1,
  autoSkipSeconds: 0.1,
  elasticity: 0.3,
  title: true,
  key: true,
  background: '#000000',
  fontScale: 1.0,
  cameraMode: 'overview',
  userScale: 1.0,
  timeScale: 1.0,
  highlightUsers: false,
  hideUsers: '',
  hideFilesRegex: '',
  hideRoot: false,
  maxUserCount: 0,
  titleText: '',
  showDates: true,
  disableProgress: false,
  disableAutoRotate: false,
  showLines: true,
  followUsers: false,
  maxFilelag: 0.5,
  multiSampling: true,
  bloom: false,
  bloomIntensity: 0.4,
  bloomMultiplier: 0.7,
  extraArgs: ''
};

// Default configuration profile
const defaultGourceConfig = {
  id: 'default',
  name: 'Default Gource Config File',
  description: 'Default config file used for all projects that don\'t have a specific config file',
  settings: defaultSettings,
  isDefault: true,
  dateCreated: new Date().toISOString(),
  lastModified: new Date().toISOString()
};

// Descriptions for each setting with detailed explanations
const settingsDescriptions = {
  resolution: "Définit la résolution de la vidéo au format LARGEURxHAUTEUR (ex: 1920x1080)",
  framerate: "Nombre d'images par seconde dans la vidéo exportée",
  secondsPerDay: "Nombre de secondes à consacrer à chaque journée d'activité",
  autoSkipSeconds: "Saute automatiquement les périodes d'inactivité supérieures à cette valeur (en secondes)",
  elasticity: "Contrôle l'élasticité des connexions entre fichiers et utilisateurs (0.0-1.0)",
  title: "Affiche le titre du projet en haut de la visualisation",
  key: "Affiche la légende des types de fichiers",
  background: "Couleur d'arrière-plan de la visualisation",
  fontScale: "Taille relative des textes dans la visualisation",
  cameraMode: "Mode de caméra: 'overview' (vue d'ensemble), 'track' (suit l'activité), 'follow' (suit les utilisateurs)",
  userScale: "Taille relative des avatars utilisateurs",
  timeScale: "Vitesse relative du temps dans la visualisation",
  highlightUsers: "Met en évidence les utilisateurs durant leur activité",
  hideUsers: "Masque certains utilisateurs (séparés par des virgules)",
  hideFilesRegex: "Expression régulière pour masquer certains fichiers",
  hideRoot: "Masque le répertoire racine dans la visualisation",
  maxUserCount: "Limite le nombre maximal d'utilisateurs affichés (0 = pas de limite)",
  titleText: "Texte personnalisé du titre (vide = utiliser le nom du projet)",
  showDates: "Affiche les dates dans la visualisation",
  disableProgress: "Désactive la barre de progression",
  disableAutoRotate: "Désactive la rotation automatique de la caméra",
  showLines: "Affiche les lignes reliant les fichiers aux utilisateurs",
  followUsers: "La caméra suit les utilisateurs actifs",
  maxFilelag: "Délai maximal avant que les fichiers n'apparaissent (en secondes)",
  multiSampling: "Active l'anti-aliasing pour une meilleure qualité d'image",
  bloom: "Ajoute un effet de luminosité (bloom) aux éléments brillants",
  bloomIntensity: "Intensité de l'effet de bloom (0.0-1.0)",
  bloomMultiplier: "Multiplicateur de l'effet de bloom (0.0-1.0)",
  extraArgs: "Arguments supplémentaires à passer directement à Gource"
};

// Export for ES modules (client-side)
export { defaultSettings, defaultGourceConfig, settingsDescriptions }; 