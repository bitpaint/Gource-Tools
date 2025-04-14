/**
 * Shared module for Gource configurations
 * Used by both client and server
 * This file serves as a single source of truth for Gource default settings
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
  resolution: "Sets the video resolution in WIDTHxHEIGHT format (e.g. 1920x1080)",
  framerate: "Number of frames per second in the exported video",
  secondsPerDay: "Number of seconds allocated to each day of activity",
  autoSkipSeconds: "Automatically skips periods of inactivity longer than this value (in seconds)",
  elasticity: "Controls the elasticity of connections between files and users (0.0-1.0)",
  title: "Displays the project title at the top of the visualization",
  key: "Displays the legend for file types",
  background: "Background color of the visualization",
  fontScale: "Relative size of text in the visualization",
  cameraMode: "Camera mode: 'overview', 'track' (follows activity), 'follow' (follows users)",
  userScale: "Relative size of user avatars",
  timeScale: "Relative speed of time in the visualization",
  highlightUsers: "Highlights users during their activity",
  hideUsers: "Hides specific users (comma-separated)",
  hideFilesRegex: "Regular expression to hide certain files",
  hideRoot: "Hides the root directory in the visualization",
  maxUserCount: "Limits the maximum number of users displayed (0 = no limit)",
  titleText: "Custom title text (empty = use project name)",
  showDates: "Shows dates in the visualization",
  disableProgress: "Disables the progress bar",
  disableAutoRotate: "Disables automatic camera rotation",
  showLines: "Shows lines connecting files to users",
  followUsers: "Camera follows active users",
  maxFilelag: "Maximum delay before files appear (in seconds)",
  multiSampling: "Enables anti-aliasing for better image quality",
  bloom: "Adds a bloom effect to bright elements",
  bloomIntensity: "Intensity of the bloom effect (0.0-1.0)",
  bloomMultiplier: "Multiplier for the bloom effect (0.0-1.0)",
  extraArgs: "Additional arguments to pass directly to Gource"
};

/**
 * Converts configuration parameters to arguments for the Gource command line
 * @param {Object} settings - Configuration parameters
 * @returns {string} Arguments for Gource in command line format
 */
function convertToGourceArgs(settings) {
  if (!settings) {
    return '';
  }

  // STEP 1: Normalize parameters to avoid inconsistencies
  // ==========================================================
  
  // Create a normalized parameters object
  let normalizedSettings = {};
  
  // Mapping table between different possible formats
  const kebabToCamel = {
    // kebab-case to camelCase format
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
    'background-colour': 'background',
    'start-date': 'startDate',
    'stop-date': 'stopDate'
  };
  
  // Generate the inverse camelToKebab mapping
  const camelToKebab = {};
  Object.entries(kebabToCamel).forEach(([kebab, camel]) => {
    camelToKebab[camel] = kebab;
  });
  
  // PHASE 1: First, retrieve all parameters in camelCase (default parameters)
  for (const [key, value] of Object.entries(settings)) {
    // Ignore kebab-case parameters for this phase
    if (key.includes('-')) continue;
    if (value === null || value === undefined) continue;
    
    // Normalize values
    let normalizedValue = value;
    
    // Conversion for boolean values
    if (value === 1 || value === '1' || value === 'true') {
      normalizedValue = true;
    } 
    else if (value === 0 || value === '0' || value === 'false') {
      normalizedValue = false;
    }
    // Color normalization (add # if missing)
    else if (typeof value === 'string' && 
        (key.includes('Color') || key === 'background')) {
      normalizedValue = value.startsWith('#') ? value : `#${value}`;
    }
    
    normalizedSettings[key] = normalizedValue;
  }
  
  // PHASE 2: Then, apply kebab-case parameters (which have priority as they likely come from the UI)
  for (const [key, value] of Object.entries(settings)) {
    // Ignore null/undefined values
    if (value === null || value === undefined) continue;
    if (!key.includes('-')) continue; // Only process kebab-case parameters
    
    // Find the corresponding camelCase key
    const camelKey = kebabToCamel[key] || key;
    
    // Normalize values
    let normalizedValue = value;
    
    // Conversion for boolean values
    if (value === 1 || value === '1' || value === 'true') {
      normalizedValue = true;
    } 
    else if (value === 0 || value === '0' || value === 'false') {
      normalizedValue = false;
    }
    // Color normalization (add # if missing)
    else if (typeof value === 'string' && 
        (key.includes('colour') || key === 'background-colour')) {
      normalizedValue = value.startsWith('#') ? value : `#${value}`;
    }
    
    // Add a log to see which parameter is replaced
    if (normalizedSettings[camelKey] !== undefined) {
      console.log(`Priority: ${key}=${normalizedValue} replaces ${camelKey}=${normalizedSettings[camelKey]}`);
    }
    
    // Apply with priority
    normalizedSettings[camelKey] = normalizedValue;
  }
  
  // STEP 2: Convert normalized parameters to Gource arguments
  // ==========================================================
  
  // Map of conversion from JS parameter names to Gource options
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
    rangeDays: 'range-days',
    startDate: 'start-date',
    stopDate: 'stop-date'
  };

  // Debug: display normalized parameters
  console.log("FINAL NORMALIZED PARAMETERS:", JSON.stringify(normalizedSettings, null, 2));

  // Generate arguments
  let args = '';

  // Process each normalized parameter
  for (const [key, value] of Object.entries(normalizedSettings)) {
    // Ignore empty values
    if (value === '' || value === null || value === undefined) {
      continue;
    }

    // Special case for extra arguments
    if (key === 'extraArgs') {
      // Add extra arguments directly
      args += `${value} `;
      continue;
    }

    // Get the corresponding Gource option
    const gourceOption = paramMap[key] || key;

    // Special handling for colors (remove the #)
    if (typeof value === 'string' && 
        (key.includes('Color') || key === 'background')) {
      const colorValue = value.replace(/^#/, '');
      args += `--${gourceOption} ${colorValue} `;
      continue;
    }

    // Special handling for date values to ensure format is YYYY-MM-DD
    if ((key === 'startDate' || key === 'stopDate') && value) {
      // Ensure date is in YYYY-MM-DD format
      const dateValue = typeof value === 'object' ? value.toISOString().split('T')[0] : value;
      args += `--${gourceOption} ${dateValue} `;
      continue;
    }

    // Special handling for boolean values
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

    // Numeric parameters
    if (typeof value === 'number') {
      args += `--${gourceOption} ${value} `;
      continue;
    }

    // Standard string parameters
    if (typeof value === 'string') {
      args += `--${gourceOption} "${value}" `;
      continue;
    }
  }

  return args.trim();
}

// Export for CommonJS modules (server side)
module.exports = {
  defaultGourceConfig,
  defaultSettings,
  convertToGourceArgs
}; 