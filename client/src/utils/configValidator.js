/**
 * Validateur de configurations Gource
 * Utilitaires pour valider les configurations avant de les envoyer au serveur
 */

/**
 * Valide une configuration Gource et retourne les erreurs trouvées
 * @param {Object} config - Configuration Gource à valider
 * @returns {Object} Résultat de validation avec les erreurs
 */
export function validateGourceConfig(config) {
  if (!config) {
    return { isValid: false, errors: ['Configuration invalide ou manquante'] };
  }
  
  const errors = [];
  
  // Vérifications des paramètres numériques
  if (config.secondsPerDay !== undefined && (isNaN(config.secondsPerDay) || config.secondsPerDay <= 0)) {
    errors.push(`"seconds-per-day" doit être un nombre positif (actuel: ${config.secondsPerDay})`);
  }
  
  if (config.autoSkipSeconds !== undefined && (isNaN(config.autoSkipSeconds) || config.autoSkipSeconds < 0)) {
    errors.push(`"auto-skip-seconds" doit être un nombre positif ou nul (actuel: ${config.autoSkipSeconds})`);
  }
  
  if (config.elasticity !== undefined && (isNaN(config.elasticity) || config.elasticity < 0 || config.elasticity > 1)) {
    errors.push(`"elasticity" doit être un nombre entre 0 et 1 (actuel: ${config.elasticity})`);
  }
  
  if (config.fontScale !== undefined && (isNaN(config.fontScale) || config.fontScale <= 0)) {
    errors.push(`"font-scale" doit être un nombre positif (actuel: ${config.fontScale})`);
  }
  
  if (config.userScale !== undefined && (isNaN(config.userScale) || config.userScale <= 0)) {
    errors.push(`"user-scale" doit être un nombre positif (actuel: ${config.userScale})`);
  }
  
  if (config.timeScale !== undefined && (isNaN(config.timeScale) || config.timeScale <= 0)) {
    errors.push(`"time-scale" doit être un nombre positif (actuel: ${config.timeScale})`);
  }
  
  if (config.maxUserCount !== undefined && (isNaN(config.maxUserCount) || config.maxUserCount < 0)) {
    errors.push(`"max-user-count" doit être un nombre positif ou nul (actuel: ${config.maxUserCount})`);
  }
  
  if (config.framerate !== undefined && (isNaN(config.framerate) || config.framerate < 24 || config.framerate > 120)) {
    errors.push(`"framerate" doit être un nombre entre 24 et 120 (actuel: ${config.framerate})`);
  }
  
  if (config.bloomIntensity !== undefined && (isNaN(config.bloomIntensity) || config.bloomIntensity < 0 || config.bloomIntensity > 1)) {
    errors.push(`"bloom-intensity" doit être un nombre entre 0 et 1 (actuel: ${config.bloomIntensity})`);
  }
  
  if (config.bloomMultiplier !== undefined && (isNaN(config.bloomMultiplier) || config.bloomMultiplier < 0 || config.bloomMultiplier > 1)) {
    errors.push(`"bloom-multiplier" doit être un nombre entre 0 et 1 (actuel: ${config.bloomMultiplier})`);
  }
  
  // Vérification du format de résolution
  if (config.resolution && !/^\d+x\d+$/.test(config.resolution)) {
    errors.push(`"resolution" doit être au format LARGEURxHAUTEUR (actuel: ${config.resolution})`);
  }
  
  // Vérification du mode de caméra
  if (config.cameraMode && !['overview', 'track', 'follow'].includes(config.cameraMode)) {
    errors.push(`"camera-mode" doit être 'overview', 'track' ou 'follow' (actuel: ${config.cameraMode})`);
  }
  
  // Vérification des couleurs (format hexadécimal)
  if (config.background && !/^#?([0-9A-Fa-f]{6}|[0-9A-Fa-f]{3})$/.test(config.background)) {
    errors.push(`"background" doit être une couleur au format hexadécimal (actuel: ${config.background})`);
  }
  
  // Vérification des dates (si présentes)
  if (config.startDate && !/^\d{4}-\d{2}-\d{2}$/.test(config.startDate)) {
    errors.push(`"start-date" doit être au format YYYY-MM-DD (actuel: ${config.startDate})`);
  }
  
  if (config.stopDate && !/^\d{4}-\d{2}-\d{2}$/.test(config.stopDate)) {
    errors.push(`"stop-date" doit être au format YYYY-MM-DD (actuel: ${config.stopDate})`);
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * Corrige une configuration Gource pour s'assurer qu'elle est valide
 * @param {Object} config - Configuration Gource à corriger
 * @returns {Object} Configuration corrigée
 */
export function fixGourceConfig(config) {
  if (!config) return {};
  
  const fixedConfig = { ...config };
  
  // Correction des paramètres numériques
  if (fixedConfig.secondsPerDay === undefined || isNaN(fixedConfig.secondsPerDay) || fixedConfig.secondsPerDay <= 0) {
    fixedConfig.secondsPerDay = 1;
  }
  
  if (fixedConfig.autoSkipSeconds === undefined || isNaN(fixedConfig.autoSkipSeconds) || fixedConfig.autoSkipSeconds < 0) {
    fixedConfig.autoSkipSeconds = 0.1;
  }
  
  if (fixedConfig.elasticity === undefined || isNaN(fixedConfig.elasticity) || fixedConfig.elasticity < 0 || fixedConfig.elasticity > 1) {
    fixedConfig.elasticity = 0.3;
  }
  
  if (fixedConfig.fontScale === undefined || isNaN(fixedConfig.fontScale) || fixedConfig.fontScale <= 0) {
    fixedConfig.fontScale = 1.0;
  }
  
  if (fixedConfig.userScale === undefined || isNaN(fixedConfig.userScale) || fixedConfig.userScale <= 0) {
    fixedConfig.userScale = 1.0;
  }
  
  if (fixedConfig.timeScale === undefined || isNaN(fixedConfig.timeScale) || fixedConfig.timeScale <= 0) {
    fixedConfig.timeScale = 1.0;
  }
  
  if (fixedConfig.maxUserCount === undefined || isNaN(fixedConfig.maxUserCount) || fixedConfig.maxUserCount < 0) {
    fixedConfig.maxUserCount = 0;
  }
  
  if (fixedConfig.framerate === undefined || isNaN(fixedConfig.framerate) || fixedConfig.framerate < 24 || fixedConfig.framerate > 120) {
    fixedConfig.framerate = 60;
  }
  
  if (fixedConfig.bloomIntensity === undefined || isNaN(fixedConfig.bloomIntensity) || fixedConfig.bloomIntensity < 0 || fixedConfig.bloomIntensity > 1) {
    fixedConfig.bloomIntensity = 0.4;
  }
  
  if (fixedConfig.bloomMultiplier === undefined || isNaN(fixedConfig.bloomMultiplier) || fixedConfig.bloomMultiplier < 0 || fixedConfig.bloomMultiplier > 1) {
    fixedConfig.bloomMultiplier = 0.7;
  }
  
  // Correction de la résolution
  if (!fixedConfig.resolution || !/^\d+x\d+$/.test(fixedConfig.resolution)) {
    fixedConfig.resolution = '1920x1080';
  }
  
  // Correction du mode de caméra
  if (!fixedConfig.cameraMode || !['overview', 'track', 'follow'].includes(fixedConfig.cameraMode)) {
    fixedConfig.cameraMode = 'overview';
  }
  
  // Correction des couleurs
  if (fixedConfig.background) {
    if (!fixedConfig.background.startsWith('#')) {
      fixedConfig.background = `#${fixedConfig.background}`;
    }
    
    if (!/^#([0-9A-Fa-f]{6}|[0-9A-Fa-f]{3})$/.test(fixedConfig.background)) {
      fixedConfig.background = '#000000';
    }
  } else {
    fixedConfig.background = '#000000';
  }
  
  // S'assurer que toutes les autres couleurs ont le format correct (avec #)
  const colorParams = ['fontColor', 'titleColor', 'dirColor', 'highlightColor', 'selectionColor'];
  
  colorParams.forEach(param => {
    if (fixedConfig[param]) {
      // Ajouter le # si manquant
      if (!fixedConfig[param].startsWith('#')) {
        fixedConfig[param] = `#${fixedConfig[param]}`;
      }
      
      // Valider le format et remplacer par défaut si invalide
      if (!/^#([0-9A-Fa-f]{6}|[0-9A-Fa-f]{3})$/.test(fixedConfig[param])) {
        fixedConfig[param] = '#FFFFFF'; // Blanc par défaut pour la plupart des couleurs
      }
    }
  });
  
  // Définir par défaut les options booléennes importantes
  if (fixedConfig.title === undefined) fixedConfig.title = true;
  if (fixedConfig.key === undefined) fixedConfig.key = true;
  if (fixedConfig.showLines === undefined) fixedConfig.showLines = true;
  if (fixedConfig.disableAutoRotate === undefined) fixedConfig.disableAutoRotate = false;
  if (fixedConfig.swapTitleDate === undefined) fixedConfig.swapTitleDate = false;
  if (fixedConfig.highlightUsers === undefined) fixedConfig.highlightUsers = false;
  if (fixedConfig.hideRoot === undefined) fixedConfig.hideRoot = false;
  
  return fixedConfig;
}

// Créer un objet nommé pour l'export par défaut (pour résoudre l'avertissement ESLint)
const configValidator = {
  validateGourceConfig,
  fixGourceConfig
};

export default configValidator; 