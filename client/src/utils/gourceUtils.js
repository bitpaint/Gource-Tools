/**
 * Utilitaires pour Gource
 * Fonctions de conversion et d'aide pour les paramètres de Gource
 */

/**
 * Mapping between camelCase and kebab-case for Gource options
 * @type {Object}
 */
const paramMapping = {
  // Video settings
  resolution: 'resolution',
  framerate: 'framerate',
  
  // Basic settings
  secondsPerDay: 'seconds-per-day',
  autoSkipSeconds: 'auto-skip-seconds',
  elasticity: 'elasticity',
  
  // Display settings
  title: 'title',
  key: 'key',
  background: 'background-colour',
  fontScale: 'font-scale',
  cameraMode: 'camera-mode',
  userScale: 'user-scale',
  timeScale: 'time-scale',
  fileScale: 'file-scale',
  dirSize: 'dir-size',
  
  // Font settings
  fontSize: 'font-size',
  filenameFontSize: 'filename-font-size',
  dirnameFontSize: 'dirname-font-size',
  userFontSize: 'user-font-size',
  
  // Color settings
  fontColor: 'font-colour',
  titleColor: 'title-colour',
  dirColor: 'dir-colour',
  highlightColor: 'highlight-colour',
  selectionColor: 'selection-colour',
  
  // Time settings
  dateFormat: 'date-format',
  startDate: 'start-date',
  stopDate: 'stop-date',
  
  // User settings
  highlightUsers: 'highlight-users',
  hideUsers: 'hide-users',
  hideFilesRegex: 'file-filter',
  hideRoot: 'hide-root',
  maxUserCount: 'max-user-count',
  
  // Boolean flags
  showDates: 'show-dates',
  disableProgress: 'disable-progress',
  disableAutoRotate: 'disable-auto-rotate',
  showLines: 'show-files',
  followUsers: 'follow-users',
  swapTitleDate: 'swap-title-date',
  
  // Advanced settings
  maxFilelag: 'max-file-lag',
  multiSampling: 'multi-sampling',
  bloom: 'bloom',
  bloomIntensity: 'bloom-intensity',
  bloomMultiplier: 'bloom-multiplier',
  titleText: 'title-text',
  userImageDir: 'user-image-dir',
  extraArgs: 'extra-args'
};

/**
 * Reverse mapping for kebab to camel
 * @type {Object}
 */
const reverseMapping = Object.entries(paramMapping).reduce((acc, [camel, kebab]) => {
  acc[kebab] = camel;
  return acc;
}, {});

/**
 * Convertit des noms de paramètres de kebab-case à camelCase
 * @param {Object} obj - Objet avec des clés en kebab-case
 * @returns {Object} Objet avec des clés en camelCase
 */
export function convertToCamelCase(obj) {
  if (!obj || typeof obj !== 'object') return obj;
  
  const result = {};
  Object.entries(obj).forEach(([key, value]) => {
    // Use mapping if available, or fallback to automatic conversion
    const camelKey = reverseMapping[key] || key.replace(/-([a-z])/g, (g) => g[1].toUpperCase());
    result[camelKey] = value;
  });
  
  return result;
}

/**
 * Convertit des noms de paramètres de camelCase à kebab-case
 * @param {Object} obj - Objet avec des clés en camelCase
 * @returns {Object} Objet avec des clés en kebab-case
 */
export function convertToKebabCase(obj) {
  if (!obj || typeof obj !== 'object') return obj;
  
  const result = {};
  
  for (const [key, value] of Object.entries(obj)) {
    // Use mapping if available, or fallback to automatic conversion
    const kebabKey = paramMapping[key] || key.replace(/([a-z0-9]|(?=[A-Z]))([A-Z])/g, '$1-$2').toLowerCase();
    
    // Traitement spécial pour secondsPerDay qui doit être un nombre valide ≥ 1
    if (key === 'secondsPerDay') {
      // S'assurer que la valeur est un nombre valide et au moins 1
      const numValue = parseFloat(value);
      result[kebabKey] = isNaN(numValue) || numValue < 1 ? 1 : numValue;
      continue;
    }
    
    // Ne pas inclure les valeurs vides, null ou undefined
    if (value === undefined || value === null || value === '') {
      // Pour les valeurs numériques strictes qui sont devenues undefined, on les initialise à 0
      if (['auto-skip-seconds', 'elasticity', 'font-scale', 
           'user-scale', 'time-scale', 'file-scale', 'dir-size', 
           'max-file-lag', 'bloom-intensity', 'bloom-multiplier'].includes(kebabKey)) {
        // Pour les paramètres numériques, initialiser avec une valeur par défaut
        result[kebabKey] = 0;
      } else {
        // Omettre les autres valeurs undefined/null/empty
        continue;
      }
    } else if (typeof value === 'boolean') {
      // Pour les booléens, utiliser le format texte que Gource accepte
      result[kebabKey] = value;
    } else {
      // Pour les autres types, copier la valeur telle quelle
      result[kebabKey] = value;
    }
  }
  
  return result;
}

/**
 * Génère la commande Gource à partir des paramètres
 * @param {Object} settings - Paramètres Gource
 * @param {string} logPath - Chemin du fichier de log
 * @returns {string} Commande Gource complète
 */
export const generateGourceCommand = (settings, logPath) => {
  if (!settings || !logPath) return '';
  
  // Convertir en kebab-case pour Gource
  const kebabSettings = convertToKebabCase(settings);
  
  let command = 'gource';
  
  // Traitement spécial pour certains paramètres qui nécessitent une conversion
  const specialParams = {
    'show-lines': (value) => {
      // Si showLines est false, ajouter --hide-edges
      if (value === false || value === 'false') return '--hide-edges';
      return null; // Ne rien ajouter si true (comportement par défaut)
    },
    'follow-users': (value) => {
      // Si followUsers est true, ajouter --follow-users
      if (value === true || value === 'true') return '--follow-all-users';
      return null;
    }
  };
  
  // Ajouter les paramètres
  Object.entries(kebabSettings).forEach(([key, value]) => {
    // Ignorer les paramètres vides
    if (value === '' || value === null || value === undefined) return;
    
    // Traitement spécial pour certains paramètres
    if (key in specialParams) {
      const specialArg = specialParams[key](value);
      if (specialArg) command += ` ${specialArg}`;
      return;
    }
    
    // Traitement des booléens
    if (typeof value === 'boolean') {
      if (value === true) {
        command += ` --${key}`;
      } else if (key.startsWith('disable-') || key.startsWith('hide-')) {
        // Si c'est un paramètre de désactivation à false, on l'ignore
        return;
      } else {
        // Pour les autres booléens à false, on inverse si possible
        // Par exemple, si key = "show-something" et value = false, 
        // on ajoute "--hide-something"
        if (key.startsWith('show-')) {
          const oppositeKey = key.replace('show-', 'hide-');
          command += ` --${oppositeKey}`;
        }
      }
    } else {
      // Paramètres avec valeurs
      command += ` --${key} ${value}`;
    }
  });
  
  // Ajouter le chemin du log
  command += ` "${logPath}"`;
  
  return command;
};

/**
 * Retourne la liste des résolutions communes
 * @returns {string[]} Liste des résolutions au format WIDTHxHEIGHT
 */
export function getCommonResolutions() {
  return [
    '1280x720',   // HD
    '1920x1080',  // Full HD
    '2560x1440',  // WQHD
    '3840x2160'   // 4K UHD
  ];
}

/**
 * Retourne la liste des modes de caméra
 * @returns {Object[]} Liste des modes de caméra avec valeur et libellé
 */
export function getCameraModes() {
  return [
    { value: 'overview', label: 'Overview' },
    { value: 'track', label: 'Track' },
    { value: 'follow', label: 'Follow' }
  ];
}

/**
 * Get a complete list of all supported Gource parameters
 * @returns {string[]} List of all supported Gource parameters
 */
export function getAllGourceParameters() {
  return Object.values(paramMapping);
} 