/**
 * Module partagé pour les configurations Gource
 * Utilisé à la fois par le client et le serveur
 * Ce fichier sert de source unique de vérité pour les paramètres par défaut de Gource
 */

// Paramètres par défaut pour Gource
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

// Profil de configuration par défaut
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

/**
 * Convertit les paramètres de configuration en arguments pour la ligne de commande Gource
 * @param {Object} settings - Paramètres de configuration
 * @returns {string} Arguments pour Gource au format ligne de commande
 */
function convertToGourceArgs(settings) {
  if (!settings) {
    return '';
  }

  // ÉTAPE 1: Normaliser les paramètres pour éviter les incohérences
  // ==========================================================
  
  // Créer un objet de paramètres normalisés
  let normalizedSettings = {};
  
  // Table de correspondance entre les différents formats possibles
  const kebabToCamel = {
    // Format kebab-case vers camelCase
    'seconds-per-day': 'secondsPerDay',
    'auto-skip-seconds': 'autoSkipSeconds',
    'font-scale': 'fontScale',
    'user-scale': 'userScale',
    'time-scale': 'timeScale',
    'camera-mode': 'cameraMode',
    'max-user-count': 'maxUserCount',
    'title-text': 'titleText',
    'max-file-lag': 'maxFilelag',
    'font-colour': 'fontColor',
    'title-colour': 'titleColor',
    'dir-colour': 'dirColor',
    'highlight-colour': 'highlightColor',
    'selection-colour': 'selectionColor',
    'highlight-users': 'highlightUsers',
    'hide-users': 'hideUsers',
    'file-filter': 'hideFilesRegex',
    'hide-files-regex': 'hideFilesRegex',
    'hide-root': 'hideRoot',
    'show-dates': 'showDates',
    'disable-progress': 'disableProgress',
    'disable-auto-rotate': 'disableAutoRotate',
    'show-files': 'showLines',
    'follow-users': 'followUsers',
    'multi-sampling': 'multiSampling',
    'bloom-intensity': 'bloomIntensity',
    'bloom-multiplier': 'bloomMultiplier',
    'extra-args': 'extraArgs',
    'date-format': 'dateFormat',
    'highlight-all-users': 'highlightAllUsers',
    'range-days': 'rangeDays',
    'background-colour': 'background'
  };
  
  // Générer le mapping inverse camelToKebab
  const camelToKebab = {};
  Object.entries(kebabToCamel).forEach(([kebab, camel]) => {
    camelToKebab[camel] = kebab;
  });
  
  // PHASE 1: D'abord, récupérer tous les paramètres en camelCase (paramètres par défaut)
  for (const [key, value] of Object.entries(settings)) {
    // Ignorer les paramètres kebab-case pour cette phase
    if (key.includes('-')) continue;
    if (value === null || value === undefined) continue;
    
    // Normaliser les valeurs
    let normalizedValue = value;
    
    // Conversion pour les valeurs booléennes
    if (value === 1 || value === '1' || value === 'true') {
      normalizedValue = true;
    } 
    else if (value === 0 || value === '0' || value === 'false') {
      normalizedValue = false;
    }
    // Normalisation des couleurs (ajout du # si manquant)
    else if (typeof value === 'string' && 
        (key.includes('Color') || key === 'background')) {
      normalizedValue = value.startsWith('#') ? value : `#${value}`;
    }
    
    normalizedSettings[key] = normalizedValue;
  }
  
  // PHASE 2: Ensuite, appliquer les paramètres kebab-case (qui ont priorité car ils viennent probablement de l'UI)
  for (const [key, value] of Object.entries(settings)) {
    // Ignorer les valeurs null/undefined
    if (value === null || value === undefined) continue;
    if (!key.includes('-')) continue; // Ne traiter que les paramètres kebab-case
    
    // Trouver la clé camelCase correspondante
    const camelKey = kebabToCamel[key] || key;
    
    // Normaliser les valeurs
    let normalizedValue = value;
    
    // Conversion pour les valeurs booléennes
    if (value === 1 || value === '1' || value === 'true') {
      normalizedValue = true;
    } 
    else if (value === 0 || value === '0' || value === 'false') {
      normalizedValue = false;
    }
    // Normalisation des couleurs (ajout du # si manquant)
    else if (typeof value === 'string' && 
        (key.includes('colour') || key === 'background-colour')) {
      normalizedValue = value.startsWith('#') ? value : `#${value}`;
    }
    
    // Ajouter un log pour voir quel paramètre est remplacé
    if (normalizedSettings[camelKey] !== undefined) {
      console.log(`Priorité: ${key}=${normalizedValue} remplace ${camelKey}=${normalizedSettings[camelKey]}`);
    }
    
    // Appliquer avec priorité
    normalizedSettings[camelKey] = normalizedValue;
  }
  
  // ÉTAPE 2: Convertir les paramètres normalisés en arguments Gource
  // ==========================================================
  
  // Map de conversion des noms de paramètres JS vers les options Gource
  const paramMap = {
    resolution: 'viewport',
    framerate: 'output-framerate',
    secondsPerDay: 'seconds-per-day',
    autoSkipSeconds: 'auto-skip-seconds',
    fontScale: 'font-scale',
    userScale: 'user-scale',
    timeScale: 'time-scale',
    cameraMode: 'camera-mode',
    maxUserCount: 'max-user-count',
    titleText: 'title-text',
    maxFilelag: 'max-file-lag',
    fontColor: 'font-colour',
    titleColor: 'title-colour',
    dirColor: 'dir-colour',
    highlightColor: 'highlight-colour',
    selectionColor: 'selection-colour',
    highlightUsers: 'highlight-users',
    hideUsers: 'hide-users',
    hideFilesRegex: 'hide-files-regex',
    hideRoot: 'hide-root',
    showDates: 'date-format',
    disableProgress: 'disable-progress',
    disableAutoRotate: 'disable-auto-rotate',
    showLines: 'show-files',
    followUsers: 'follow-users',
    background: 'background-colour',
    dateFormat: 'date-format',
    highlightAllUsers: 'highlight-all-users',
    rangeDays: 'range-days'
  };

  // Debug: afficher les paramètres normalisés
  console.log("Paramètres FINAUX normalisés:", JSON.stringify(normalizedSettings, null, 2));

  // Générer les arguments
  let args = '';

  // Traiter chaque paramètre normalisé
  for (const [key, value] of Object.entries(normalizedSettings)) {
    // Ignorer les valeurs vides
    if (value === '' || value === null || value === undefined) {
      continue;
    }

    // Obtenir le nom d'option Gource
    const gourceOption = paramMap[key] || key;

    // Traitement spécial pour les couleurs (enlever le #)
    if (typeof value === 'string' && 
        (key.includes('Color') || key === 'background')) {
      const colorValue = value.replace(/^#/, '');
      args += `--${gourceOption} ${colorValue} `;
      continue;
    }

    // Traitement spécial pour les valeurs booléennes
    if (typeof value === 'boolean') {
      if (key === 'title' && !value) {
        args += '--hide-title ';
      } else if (key === 'key' && !value) {
        args += '--hide-key ';
      } else if (key === 'showDates' && !value) {
        args += '--hide-date ';
      } else if (key === 'showLines' && !value) {
        args += '--hide-files ';
      } else if (key === 'highlightAllUsers' && value) {
        args += '--highlight-all-users ';
      } else if (value === true) {
        args += `--${gourceOption} `;
      }
      continue;
    }

    // Paramètres numériques
    if (typeof value === 'number') {
      args += `--${gourceOption} ${value} `;
      continue;
    }

    // Paramètres string standards
    if (typeof value === 'string') {
      args += `--${gourceOption} "${value}" `;
      continue;
    }
  }

  return args.trim();
}

// Export pour les modules CommonJS (côté serveur)
module.exports = {
  defaultGourceConfig,
  defaultSettings,
  convertToGourceArgs
}; 