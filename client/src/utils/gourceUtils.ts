/**
 * Utilities for Gource
 * Functions for conversion and help with Gource parameters
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
const reverseMapping: { [key: string]: string } = Object.entries(paramMapping).reduce((acc: { [key: string]: string }, [camel, kebab]) => {
  acc[kebab] = camel;
  return acc;
}, {});

/**
 * Converts parameter names from kebab-case to camelCase
 * @param {Object} obj - Object with kebab-case keys
 * @returns {Object} Object with camelCase keys
 */
export function convertToCamelCase(obj: Record<string, any>): Record<string, any> {
  if (!obj || typeof obj !== 'object') return obj;
  
  const result: Record<string, any> = {};
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
export function convertToKebabCase(obj: Record<string, any>): Record<string, any> {
  if (!obj || typeof obj !== 'object') return obj;
  
  const result: Record<string, any> = {};
  
  for (const [key, value] of Object.entries(obj)) {
    // Use mapping if available, or fallback to automatic conversion
    const kebabKey = paramMapping[key as keyof typeof paramMapping] || key.replace(/([a-z0-9]|(?=[A-Z]))([A-Z])/g, '$1-$2').toLowerCase();
    
    // Special handling for secondsPerDay which must be a valid number ≥ 1
    if (key === 'secondsPerDay') {
      // Ensure the value is a valid number and at least 1
      const numValue = parseFloat(String(value)); // Convert value to string before parseFloat
      result[kebabKey] = isNaN(numValue) || numValue < 1 ? 1 : numValue;
      continue;
    }
    
    // Don't include empty, null or undefined values
    if (value === undefined || value === null || value === '') {
      // For strict numeric values that have become undefined, initialize them to 0
      if (['auto-skip-seconds', 'elasticity', 'font-scale', 
           'user-scale', 'time-scale', 'file-scale', 'dir-size', 
           'max-file-lag', 'bloom-intensity', 'bloom-multiplier'].includes(kebabKey)) {
        // For numeric parameters, initialize with a default value
        result[kebabKey] = 0;
      } else {
        // Omit other undefined/null/empty values
        continue;
      }
    } else if (typeof value === 'boolean') {
      // For booleans, use the text format that Gource accepts
      result[kebabKey] = value;
    } else {
      // For other types, copy the value as is
      result[kebabKey] = value;
    }
  }
  
  return result;
}

/**
 * Generates the Gource command from parameters
 * @param {Record<string, any>} settings - Gource parameters object
 * @param {string} logPath - Path to the log file
 * @returns {string} Complete Gource command
 */
export const generateGourceCommand = (settings: Record<string, any>, logPath: string): string => {
  if (!settings || !logPath) return '';
  
  // Create a copy of settings to avoid modifying the original
  const settingsCopy = { ...settings };
  
  // Fix the title issue - if title is enabled but no titleText is provided,
  // use a default value to prevent Gource from showing other args as title
  if (settingsCopy.title === true && (!settingsCopy.titleText || String(settingsCopy.titleText).trim() === '')) {
    // If no titleText is provided but title is enabled, use a fallback
    settingsCopy.titleText = settingsCopy.name || 'Git Repository';
  }
  
  // Convert to kebab-case for Gource
  const kebabSettings = convertToKebabCase(settingsCopy);
  
  let command = 'gource';
  
  // Special handling for certain parameters that require conversion
  const specialParams: { [key: string]: (value: any) => string | null } = {
    'show-lines': (value: boolean | string | undefined): string | null => {
      // If showLines is false, add --hide-edges
      if (value === false || value === 'false') return '--hide-edges';
      return null; // Don't add anything if true (default behavior)
    },
    'follow-users': (value: boolean | string | undefined): string | null => {
      // If followUsers is true, add --follow-users
      if (value === true || value === 'true') return '--follow-all-users';
      return null;
    }
  };
  
  // Add parameters
  Object.entries(kebabSettings).forEach(([key, value]) => {
    // Ignore empty parameters or stop-at-time if 0
    if (value === '' || value === null || value === undefined || (key === 'stop-at-time' && value === 0)) {
      return;
    }
    
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
        // If it's a disable parameter set to false, ignore it
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
      // Ensure value is properly escaped if it contains spaces, etc.
      // For simplicity, we assume values are simple strings/numbers here.
      // Gource might need specific escaping for certain values.
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
 * Converts UI parameters to the format expected by the API
 * @param {Record<string, any>} formData - Edit form data
 * @returns {Record<string, any>} Parameters formatted for the API
 */
export function convertFormToApiParams(formData: Record<string, any>): Record<string, any> {
  // Make a copy to avoid modifying the original
  const apiParams = { ...formData };
  
  // Conversion table for special parameters
  const mappings: { [key: string]: string } = {
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

  // Ensure stopAtTime is a valid number if provided, otherwise leave it as is
  if (apiParams.stopAtTime === '') {
      apiParams.stopAtTime = undefined; // Convert empty string to undefined
  } else if (apiParams.stopAtTime !== null && apiParams.stopAtTime !== undefined) {
      if (typeof apiParams.stopAtTime === 'string') {
          const numValue = parseFloat(apiParams.stopAtTime);
          // If parsing fails, set to undefined, otherwise keep the number
          apiParams.stopAtTime = isNaN(numValue) ? undefined : numValue;
      }
      // If it's already a number or something else non-empty, leave it
  }
  // If it was already null or undefined, it stays that way
  
  return apiParams;
}

/**
 * Converts API parameters to UI display format
 * @param {Record<string, any>} apiParams - API parameters
 * @returns {Record<string, any>} Parameters formatted for the UI
 */
export function convertApiToFormParams(apiParams: Record<string, any>): Record<string, any> {
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