/**
 * Gource Configuration Validator
 * Utilities to validate configurations before sending them to the server
 */

// Define the expected structure of the config object
interface GourceConfig {
  [key: string]: any; // Allow any Gource parameter
  secondsPerDay?: number | string;
  autoSkipSeconds?: number | string;
  elasticity?: number | string;
  fontScale?: number | string;
  userScale?: number | string;
  timeScale?: number | string;
  maxUserCount?: number | string;
  framerate?: number | string;
  bloomIntensity?: number | string;
  bloomMultiplier?: number | string;
  stopAtTime?: number | string;
  resolution?: string;
  cameraMode?: 'overview' | 'track' | 'follow';
  background?: string;
  startDate?: string | null; // Allow null
  stopDate?: string | null; // Allow null
  fontColor?: string;
  titleColor?: string;
  dirColor?: string;
  highlightColor?: string;
  selectionColor?: string;
  title?: boolean;
  key?: boolean;
  showLines?: boolean;
  disableAutoRotate?: boolean;
}

/**
 * Validates a Gource configuration and returns any errors found
 * @param {GourceConfig} config - Gource configuration to validate
 * @returns {{ isValid: boolean, errors: string[] }} Validation result with errors
 */
export function validateGourceConfig(config: GourceConfig | null | undefined): { isValid: boolean, errors: string[] } {
  if (!config) {
    return { isValid: false, errors: ['Invalid or missing configuration'] };
  }
  
  const errors: string[] = [];
  
  // Numeric parameter validations
  if (config.secondsPerDay !== undefined) {
    const val = parseFloat(String(config.secondsPerDay));
    if (isNaN(val) || val <= 0) {
      errors.push(`"seconds-per-day" must be a positive number (current: ${config.secondsPerDay})`);
    }
  }
  
  if (config.autoSkipSeconds !== undefined) {
    const val = parseFloat(String(config.autoSkipSeconds));
    if (isNaN(val) || val < 0) {
      errors.push(`"auto-skip-seconds" must be a non-negative number (current: ${config.autoSkipSeconds})`);
    }
  }
  
  if (config.elasticity !== undefined) {
    const val = parseFloat(String(config.elasticity));
    if (isNaN(val) || val < 0 || val > 1) {
      errors.push(`"elasticity" must be a number between 0 and 1 (current: ${config.elasticity})`);
    }
  }
  
  if (config.fontScale !== undefined) {
    const val = parseFloat(String(config.fontScale));
    if (isNaN(val) || val <= 0) {
      errors.push(`"font-scale" must be a positive number (current: ${config.fontScale})`);
    }
  }
  
  if (config.userScale !== undefined) {
    const val = parseFloat(String(config.userScale));
    if (isNaN(val) || val <= 0) {
      errors.push(`"user-scale" must be a positive number (current: ${config.userScale})`);
    }
  }
  
  if (config.timeScale !== undefined) {
    const val = parseFloat(String(config.timeScale));
    if (isNaN(val) || val <= 0) {
      errors.push(`"time-scale" must be a positive number (current: ${config.timeScale})`);
    }
  }
  
  if (config.maxUserCount !== undefined) {
    const val = parseInt(String(config.maxUserCount), 10);
    if (isNaN(val) || val < 0) {
      errors.push(`"max-user-count" must be a non-negative number (current: ${config.maxUserCount})`);
    }
  }
  
  if (config.framerate !== undefined) {
    const val = parseInt(String(config.framerate), 10);
    if (isNaN(val) || val < 24 || val > 120) {
      errors.push(`"framerate" must be a number between 24 and 120 (current: ${config.framerate})`);
    }
  }
  
  if (config.bloomIntensity !== undefined) {
    const val = parseFloat(String(config.bloomIntensity));
    if (isNaN(val) || val < 0 || val > 1) {
      errors.push(`"bloom-intensity" must be a number between 0 and 1 (current: ${config.bloomIntensity})`);
    }
  }
  
  if (config.bloomMultiplier !== undefined) {
    const val = parseFloat(String(config.bloomMultiplier));
    if (isNaN(val) || val < 0 || val > 1) {
      errors.push(`"bloom-multiplier" must be a number between 0 and 1 (current: ${config.bloomMultiplier})`);
    }
  }
  
  if (config.stopAtTime !== undefined) {
    const val = parseFloat(String(config.stopAtTime));
    if (isNaN(val) || val < 0) {
      errors.push(`"stop-at-time" must be a non-negative number (current: ${config.stopAtTime})`);
    }
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
 * @param {GourceConfig} config - Gource configuration to fix
 * @returns {GourceConfig} Fixed configuration
 */
export function fixGourceConfig(config: GourceConfig | null | undefined): GourceConfig {
  if (!config) return {};
  
  const fixedConfig: GourceConfig = { ...config };
  
  // Fix numeric parameters
  if (fixedConfig.secondsPerDay === undefined || isNaN(parseFloat(String(fixedConfig.secondsPerDay))) || parseFloat(String(fixedConfig.secondsPerDay)) <= 0) {
    fixedConfig.secondsPerDay = 1;
  }
  
  if (fixedConfig.autoSkipSeconds === undefined || isNaN(parseFloat(String(fixedConfig.autoSkipSeconds))) || parseFloat(String(fixedConfig.autoSkipSeconds)) < 0) {
    fixedConfig.autoSkipSeconds = 0.1;
  }
  
  if (fixedConfig.elasticity === undefined || isNaN(parseFloat(String(fixedConfig.elasticity))) || parseFloat(String(fixedConfig.elasticity)) < 0 || parseFloat(String(fixedConfig.elasticity)) > 1) {
    fixedConfig.elasticity = 0.3;
  }
  
  if (fixedConfig.fontScale === undefined || isNaN(parseFloat(String(fixedConfig.fontScale))) || parseFloat(String(fixedConfig.fontScale)) <= 0) {
    fixedConfig.fontScale = 1.0;
  }
  
  if (fixedConfig.userScale === undefined || isNaN(parseFloat(String(fixedConfig.userScale))) || parseFloat(String(fixedConfig.userScale)) <= 0) {
    fixedConfig.userScale = 1.0;
  }
  
  if (fixedConfig.timeScale === undefined || isNaN(parseFloat(String(fixedConfig.timeScale))) || parseFloat(String(fixedConfig.timeScale)) <= 0) {
    fixedConfig.timeScale = 1.0;
  }
  
  if (fixedConfig.maxUserCount === undefined || isNaN(parseInt(String(fixedConfig.maxUserCount), 10)) || parseInt(String(fixedConfig.maxUserCount), 10) < 0) {
    fixedConfig.maxUserCount = 0;
  }
  
  if (fixedConfig.framerate === undefined || isNaN(parseInt(String(fixedConfig.framerate), 10)) || parseInt(String(fixedConfig.framerate), 10) < 24 || parseInt(String(fixedConfig.framerate), 10) > 120) {
    fixedConfig.framerate = 60;
  }
  
  if (fixedConfig.bloomIntensity === undefined || isNaN(parseFloat(String(fixedConfig.bloomIntensity))) || parseFloat(String(fixedConfig.bloomIntensity)) < 0 || parseFloat(String(fixedConfig.bloomIntensity)) > 1) {
    fixedConfig.bloomIntensity = 0.4;
  }
  
  if (fixedConfig.bloomMultiplier === undefined || isNaN(parseFloat(String(fixedConfig.bloomMultiplier))) || parseFloat(String(fixedConfig.bloomMultiplier)) < 0 || parseFloat(String(fixedConfig.bloomMultiplier)) > 1) {
    fixedConfig.bloomMultiplier = 0.7;
  }
  
  if (fixedConfig.stopAtTime === undefined || isNaN(parseFloat(String(fixedConfig.stopAtTime))) || parseFloat(String(fixedConfig.stopAtTime)) < 0) {
    fixedConfig.stopAtTime = 0; // 0 means disabled (though we handle command generation elsewhere)
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