/**
 * Gource Configuration Validator
 * Utilities to validate configurations before sending them to the server
 */

/**
 * Validates a Gource configuration and returns any errors found
 * @param {Object} config - Gource configuration to validate
 * @returns {Object} Validation result with errors
 */
export function validateGourceConfig(config) {
  if (!config) {
    return { isValid: false, errors: ['Invalid or missing configuration'] };
  }
  
  const errors = [];
  
  // Numeric parameter validations
  if (config.secondsPerDay !== undefined && (isNaN(config.secondsPerDay) || config.secondsPerDay <= 0)) {
    errors.push(`"seconds-per-day" must be a positive number (current: ${config.secondsPerDay})`);
  }
  
  if (config.autoSkipSeconds !== undefined && (isNaN(config.autoSkipSeconds) || config.autoSkipSeconds < 0)) {
    errors.push(`"auto-skip-seconds" must be a non-negative number (current: ${config.autoSkipSeconds})`);
  }
  
  if (config.elasticity !== undefined && (isNaN(config.elasticity) || config.elasticity < 0 || config.elasticity > 1)) {
    errors.push(`"elasticity" must be a number between 0 and 1 (current: ${config.elasticity})`);
  }
  
  if (config.fontScale !== undefined && (isNaN(config.fontScale) || config.fontScale <= 0)) {
    errors.push(`"font-scale" must be a positive number (current: ${config.fontScale})`);
  }
  
  if (config.userScale !== undefined && (isNaN(config.userScale) || config.userScale <= 0)) {
    errors.push(`"user-scale" must be a positive number (current: ${config.userScale})`);
  }
  
  if (config.timeScale !== undefined && (isNaN(config.timeScale) || config.timeScale <= 0)) {
    errors.push(`"time-scale" must be a positive number (current: ${config.timeScale})`);
  }
  
  if (config.maxUserCount !== undefined && (isNaN(config.maxUserCount) || config.maxUserCount < 0)) {
    errors.push(`"max-user-count" must be a non-negative number (current: ${config.maxUserCount})`);
  }
  
  if (config.framerate !== undefined && (isNaN(config.framerate) || config.framerate < 24 || config.framerate > 120)) {
    errors.push(`"framerate" must be a number between 24 and 120 (current: ${config.framerate})`);
  }
  
  if (config.bloomIntensity !== undefined && (isNaN(config.bloomIntensity) || config.bloomIntensity < 0 || config.bloomIntensity > 1)) {
    errors.push(`"bloom-intensity" must be a number between 0 and 1 (current: ${config.bloomIntensity})`);
  }
  
  if (config.bloomMultiplier !== undefined && (isNaN(config.bloomMultiplier) || config.bloomMultiplier < 0 || config.bloomMultiplier > 1)) {
    errors.push(`"bloom-multiplier" must be a number between 0 and 1 (current: ${config.bloomMultiplier})`);
  }
  
  // Resolution format validation
  if (config.resolution && !/^\d+x\d+$/.test(config.resolution)) {
    errors.push(`"resolution" must be in WIDTHxHEIGHT format (current: ${config.resolution})`);
  }
  
  // Camera mode validation
  if (config.cameraMode && !['overview', 'track', 'follow'].includes(config.cameraMode)) {
    errors.push(`"camera-mode" must be 'overview', 'track', or 'follow' (current: ${config.cameraMode})`);
  }
  
  // Color validation (hexadecimal format)
  if (config.background && !/^#?([0-9A-Fa-f]{6}|[0-9A-Fa-f]{3})$/.test(config.background)) {
    errors.push(`"background" must be a hexadecimal color (current: ${config.background})`);
  }
  
  // Date validation (if present)
  if (config.startDate && !/^\d{4}-\d{2}-\d{2}$/.test(config.startDate)) {
    errors.push(`"start-date" must be in YYYY-MM-DD format (current: ${config.startDate})`);
  }
  
  if (config.stopDate && !/^\d{4}-\d{2}-\d{2}$/.test(config.stopDate)) {
    errors.push(`"stop-date" must be in YYYY-MM-DD format (current: ${config.stopDate})`);
  }
  
  return {
    isValid: errors.length === 0,
    errors: errors
  };
}

/**
 * Fixes a Gource configuration to ensure it is valid
 * @param {Object} config - Gource configuration to fix
 * @returns {Object} Fixed configuration
 */
export function fixGourceConfig(config) {
  if (!config) return {};
  
  const fixedConfig = { ...config };
  
  // Fix numeric parameters
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
  
  // Fix resolution
  if (!fixedConfig.resolution || !/^\d+x\d+$/.test(fixedConfig.resolution)) {
    fixedConfig.resolution = '1920x1080';
  }
  
  // Fix camera mode
  if (!fixedConfig.cameraMode || !['overview', 'track', 'follow'].includes(fixedConfig.cameraMode)) {
    fixedConfig.cameraMode = 'overview';
  }
  
  // Fix colors
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
  
  // Make sure all other colors have the correct format (with #)
  const colorParams = ['fontColor', 'titleColor', 'dirColor', 'highlightColor', 'selectionColor'];
  
  colorParams.forEach(param => {
    if (fixedConfig[param]) {
      // Add # if missing
      if (!fixedConfig[param].startsWith('#')) {
        fixedConfig[param] = `#${fixedConfig[param]}`;
      }
      
      // Validate format and replace with default if invalid
      if (!/^#([0-9A-Fa-f]{6}|[0-9A-Fa-f]{3})$/.test(fixedConfig[param])) {
        fixedConfig[param] = '#FFFFFF'; // White by default for most colors
      }
    }
  });
  
  // Set default values for important boolean options
  if (fixedConfig.title === undefined) fixedConfig.title = true;
  if (fixedConfig.key === undefined) fixedConfig.key = true;
  if (fixedConfig.showLines === undefined) fixedConfig.showLines = true;
  if (fixedConfig.disableAutoRotate === undefined) fixedConfig.disableAutoRotate = false;
  
  return fixedConfig;
}

// Create a named object for default export (to resolve ESLint warning)
const configValidator = {
  validateGourceConfig,
  fixGourceConfig
};

export default configValidator; 