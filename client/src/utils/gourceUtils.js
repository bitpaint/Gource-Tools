/**
 * Gource Utilities
 * Conversion and helper functions for Gource parameters
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
 * Converts parameter names from kebab-case to camelCase
 * @param {Object} obj - Object with kebab-case keys
 * @returns {Object} Object with camelCase keys
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
 * Converts parameter names from camelCase to kebab-case
 * @param {Object} obj - Object with camelCase keys
 * @returns {Object} Object with kebab-case keys
 */
export function convertToKebabCase(obj) {
  if (!obj || typeof obj !== 'object') return obj;
  
  const result = {};
  
  for (const [key, value] of Object.entries(obj)) {
    // Use mapping if available, or fallback to automatic conversion
    const kebabKey = paramMapping[key] || key.replace(/([a-z0-9]|(?=[A-Z]))([A-Z])/g, '$1-$2').toLowerCase();
    
    // Special handling for secondsPerDay which must be a valid number ≥ 1
    if (key === 'secondsPerDay') {
      // Ensure value is a valid number and at least 1
      const numValue = parseFloat(value);
      result[kebabKey] = isNaN(numValue) || numValue < 1 ? 1 : numValue;
      continue;
    }
    
    // Don't include empty, null or undefined values
    if (value === undefined || value === null || value === '') {
      // For strict numeric values that became undefined, initialize to 0
      if (['auto-skip-seconds', 'elasticity', 'font-scale', 
           'user-scale', 'time-scale', 'file-scale', 'dir-size', 
           'max-file-lag', 'bloom-intensity', 'bloom-multiplier'].includes(kebabKey)) {
        // For numeric parameters, initialize with default value
        result[kebabKey] = 0;
      } else {
        // Omit other undefined/null/empty values
        continue;
      }
    } else if (typeof value === 'boolean') {
      // For booleans, use the text format that Gource accepts
      result[kebabKey] = value;
    } else {
      // For other types, copy value as is
      result[kebabKey] = value;
    }
  }
  
  return result;
}

/**
 * Generates the Gource command from parameters
 * @param {Object} settings - Gource parameters
 * @param {string} logPath - Path to the log file
 * @returns {string} Complete Gource command
 */
export const generateGourceCommand = (settings, logPath) => {
  if (!settings || !logPath) return '';
  
  // Convert to kebab-case for Gource
  const kebabSettings = convertToKebabCase(settings);
  
  let command = 'gource';
  
  // Special handling for certain parameters that require conversion
  const specialParams = {
    'show-lines': (value) => {
      // If showLines is false, add --hide-edges
      if (value === false || value === 'false') return '--hide-edges';
      return null; // Don't add anything if true (default behavior)
    },
    'follow-users': (value) => {
      // If followUsers is true, add --follow-users
      if (value === true || value === 'true') return '--follow-all-users';
      return null;
    }
  };
  
  // Add parameters
  Object.entries(kebabSettings).forEach(([key, value]) => {
    // Ignore empty parameters
    if (value === '' || value === null || value === undefined) return;
    
    // Special handling for certain parameters
    if (key in specialParams) {
      const specialArg = specialParams[key](value);
      if (specialArg) command += ` ${specialArg}`;
      return;
    }
    
    // Handle booleans
    if (typeof value === 'boolean') {
      if (value === true) {
        command += ` --${key}`;
      } else if (key.startsWith('disable-') || key.startsWith('hide-')) {
        // If it's a disable parameter set to false, ignore
        return;
      } else {
        // For other booleans set to false, invert if possible
        // For example, if key = "show-something" and value = false, 
        // add "--hide-something"
        if (key.startsWith('show-')) {
          const oppositeKey = key.replace('show-', 'hide-');
          command += ` --${oppositeKey}`;
        }
      }
    } else {
      // Parameters with values
      command += ` --${key} ${value}`;
    }
  });
  
  // Add log path
  command += ` "${logPath}"`;
  
  return command;
};

/**
 * Returns the list of common resolutions
 * @returns {string[]} List of resolutions in WIDTHxHEIGHT format
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
 * Returns the list of camera modes
 * @returns {Object[]} List of camera modes with value and label
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

/**
 * Utilities for conversion and manipulation of Gource parameters
 */

/**
 * Converts UI form parameters to the format expected by the API
 * @param {Object} formData - Data from the edit form
 * @returns {Object} Parameters formatted for the API
 */
export function convertFormToApiParams(formData) {
  // Make a copy to avoid modifying the original
  const apiParams = { ...formData };
  
  // Conversion table for special parameters
  const mappings = {
    background: 'background-colour', // Color is stored in background-colour for the API
  };
  
  // Apply special mappings
  Object.entries(mappings).forEach(([formKey, apiKey]) => {
    if (apiParams[formKey] !== undefined) {
      // Keep both camelCase and kebab-case formats to ensure compatibility
      apiParams[apiKey] = apiParams[formKey];
      console.log(`Conversion: ${formKey} -> ${apiKey} = ${apiParams[formKey]}`);
    }
  });
  
  // Special handling for colors: ensure # is present
  Object.keys(apiParams).forEach(key => {
    if (
      typeof apiParams[key] === 'string' && 
      (key.includes('color') || key.includes('colour') || key === 'background')
    ) {
      // If it's a color and doesn't have #, add it
      if (apiParams[key] && !apiParams[key].startsWith('#')) {
        apiParams[key] = `#${apiParams[key]}`;
      }
    }
  });
  
  return apiParams;
}

/**
 * Converts API parameters to the format for display in the UI
 * @param {Object} apiParams - API parameters
 * @returns {Object} Parameters formatted for the UI
 */
export function convertApiToFormParams(apiParams) {
  // Make a copy to avoid modifying the original
  const formParams = { ...apiParams };
  
  // Priority to background-colour over background
  if (apiParams['background-colour']) {
    formParams.background = apiParams['background-colour'];
    console.log(`Priority background-colour: ${apiParams['background-colour']}`);
  }
  
  // Ensure colors have the '#'
  Object.keys(formParams).forEach(key => {
    if (
      typeof formParams[key] === 'string' && 
      (key.includes('color') || key.includes('colour') || key === 'background')
    ) {
      // If it's a color and doesn't have #, add it
      if (formParams[key] && !formParams[key].startsWith('#')) {
        formParams[key] = `#${formParams[key]}`;
      }
    }
  });
  
  return formParams;
} 