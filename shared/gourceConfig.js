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
  extraArgs: '',
  // Ajout des paramètres de filtre temporel
  timePeriod: 'all', // Peut être 'all', 'week', 'month', 'year'
  startDate: '', // Date de début au format YYYY-MM-DD
  stopDate: '', // Date de fin au format YYYY-MM-DD
  // Added Time/Position settings
  startPosition: '', // 0.0-1.0 or 'random'
  stopPosition: '', // 0.0-1.0
  stopAtTime: 0, // Seconds, 0 for disabled
  loop: false,
  loopDelaySeconds: 3,
  // Font sizes
  fontSize: 16,
  filenameFontSize: 14,
  dirnameFontSize: 14,
  userFontSize: 14,
  // Colors
  fontColor: '#FFFFFF',
  dirColor: '#FFFFFF',
  highlightColor: '#FF0000',
  selectionColor: '#FFFF00',
  filenameColor: '#FFFFFF',
  // Appearance Extras
  transparent: false,
  dirNameDepth: 0,
  dirNamePosition: 0.5,
  filenameTime: 4.0,
  // File options
  maxFiles: 0, // 0 for unlimited
  fileIdleTime: 0, // Seconds
  fileIdleTimeAtEnd: 0, // Seconds
  fileExtensions: false,
  fileExtensionFallback: false,
  // User / Avatar options
  useUserImageDir: true, // Enable by default
  defaultUserImage: '', // Path to default image
  fixedUserSize: false,
  colourImages: false,
  userFriction: 0.67,
  maxUserSpeed: 500,
  // Background / Logo
  backgroundImage: '', // Path to background image
  logo: '', // Path to logo image
  logoOffset: '', // Format XxY
  // Added Group 1 Settings
  fullscreen: false,
  screenNum: 0, // 0 for primary screen usually
  noVsync: false,
  windowPosition: '', // Format XxY
  frameless: false,
  cropAxis: '', // 'vertical' or 'horizontal'
  padding: 1.1,
  stopAtEnd: false,
  dontStop: false,
  disableAutoSkip: false,
  realtime: false,
  noTimeTravel: false,
  highlightDirs: false,
  disableInput: false,
  hashSeed: '', // String or Number
  // Added Group 2 Settings
  userShowFilter: '', // Regex
  fileShowFilter: '', // Regex
  highlightUser: '', // Specific username
  captionFile: '', // Path to caption file
  captionSize: 12, // Font size
  captionColour: '#FFFFFF',
  captionDuration: 10.0, // Seconds
  captionOffset: 0, // Horizontal offset
  // Added Last Group Settings
  fontFile: '', // Path to font file (.ttf, .otf)
  followUser: '', // Specific username to follow
  outputCustomLog: '', // Path to output custom log file
  gitBranch: '' // Specify branch for Gource's internal log generation (limited use here)
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
  extraArgs: "Additional arguments to pass directly to Gource",
  // Descriptions des nouveaux paramètres
  timePeriod: "Time period filter: 'all', 'week' (last 7 days), 'month' (last 30 days), 'year' (last 365 days)",
  startDate: "Start date for the visualization (format: YYYY-MM-DD)",
  stopDate: "End date for the visualization (format: YYYY-MM-DD)",
  // Added Time/Position descriptions
  startPosition: "Start at a specific position (0.0 to 1.0, or 'random')",
  stopPosition: "Stop at a specific position (0.0 to 1.0)",
  stopAtTime: "Stop rendering after a specific number of seconds (0 to disable)",
  loop: "Loop the visualization when it ends",
  loopDelaySeconds: "Seconds to pause before looping (default: 3)",
  // Font sizes
  fontSize: "Default font size (for title, date)",
  filenameFontSize: "Font size for filenames",
  dirnameFontSize: "Font size for directory names",
  userFontSize: "Font size for user names",
  // Colors
  fontColor: "Default font color (for title, date)",
  dirColor: "Font color for directory names",
  highlightColor: "Font color for highlighted users/directories",
  selectionColor: "Font color for selected users/files",
  // Added Appearance Extras descriptions
  transparent: "Make the background transparent (useful for overlays)",
  filenameColor: "Font color for filenames",
  dirNameDepth: "Draw directory names down to this depth (0 for default)",
  dirNamePosition: "Position directory names along the edge (0.0 to 1.0)",
  filenameTime: "Duration filenames remain on screen (seconds)",
  // File options
  maxFiles: "Maximum number of files displayed (0 for unlimited)",
  fileIdleTime: "Time files remain on screen after activity (seconds, default 0)",
  fileIdleTimeAtEnd: "Time files remain on screen at the very end (seconds, default 0)",
  fileExtensions: "Show only file extensions instead of full filenames",
  fileExtensionFallback: "Use filename if extension is missing (requires --file-extensions)",
  // User / Avatar options
  useUserImageDir: "Attempt to load user avatars from the ./avatars directory",
  defaultUserImage: "Path to an image file to use if a specific user avatar is not found",
  fixedUserSize: "Users avatars maintain a fixed size instead of scaling",
  colourImages: "Apply coloring to user avatars",
  userFriction: "Rate at which users slow down after moving (0.0 to 1.0)",
  maxUserSpeed: "Maximum speed users can travel (units per second)",
  // Background / Logo
  backgroundImage: "Path to an image file to use as the background",
  logo: "Path to an image file to display as a foreground logo",
  logoOffset: "Offset position of the logo (format: XxY, e.g., 10x10)",
  // Added Group 1 Descriptions
  fullscreen: "Run Gource in fullscreen mode",
  screenNum: "Select the screen number for fullscreen mode",
  noVsync: "Disable vertical sync (can cause tearing)",
  windowPosition: "Initial window position (format: XxY, e.g., 100x50)",
  frameless: "Run Gource in a borderless window",
  cropAxis: "Crop the view on an axis ('vertical' or 'horizontal')",
  padding: "Camera view padding around the content (default: 1.1)",
  stopAtEnd: "Stop simulation automatically at the end of the log",
  dontStop: "Keep running (camera rotating) after the log ends",
  disableAutoSkip: "Prevent automatically skipping periods of inactivity",
  realtime: "Attempt to playback at realtime speed",
  noTimeTravel: "Use the time of the last commit if a commit time is in the past",
  highlightDirs: "Highlight the names of all directories",
  disableInput: "Disable keyboard and mouse input during visualization",
  hashSeed: "Seed for the hash function (affects layout)",
  // Added Group 2 Descriptions
  userShowFilter: "Show only usernames matching this regex",
  fileShowFilter: "Show only file paths matching this regex",
  highlightUser: "Highlight a specific user by name",
  captionFile: "Path to a caption file to display timed text",
  captionSize: "Font size for captions",
  captionColour: "Font color for captions (hex)",
  captionDuration: "Default duration captions remain on screen (seconds)",
  captionOffset: "Horizontal offset for captions",
  // Added Last Group Descriptions
  fontFile: "Path to a font file (.ttf, .otf) to use for text rendering",
  followUser: "Camera will automatically follow this specific user",
  outputCustomLog: "Output a Gource custom format log file during processing (useful for debugging)",
  gitBranch: "Specify git branch when Gource generates its own log (limited use when providing custom log)"
};

/**
 * Calcule les dates de début et de fin basées sur une période
 * @param {string} period - La période ('week', 'month', 'year', 'all')
 * @returns {Object} startDate et stopDate
 */
function calculateDatesFromPeriod(period) {
  if (period === 'all') {
    return { startDate: '', stopDate: '' };
  }
  
  const now = new Date();
  const stopDate = now.toISOString().split('T')[0]; // Format YYYY-MM-DD
  
  let startDate = new Date();
  if (period === 'week') {
    startDate.setDate(now.getDate() - 7);
  } else if (period === 'month') {
    startDate.setDate(now.getDate() - 30);
  } else if (period === 'year') {
    startDate.setDate(now.getDate() - 365);
  }
  
  return {
    startDate: startDate.toISOString().split('T')[0],
    stopDate
  };
}

/**
 * Convertit les paramètres de configuration en arguments pour la ligne de commande Gource
 * Version simplifiée pour éviter les problèmes de conversion
 * @param {Object} settings - Paramètres de configuration
 * @returns {string} Arguments pour Gource au format ligne de commande
 */
function convertToGourceArgs(settings) {
  const AVATAR_DIR_PATH = './avatars'; // Define the fixed relative path
  if (!settings) {
    return '';
  }

  let args = '';
  
  // Explicit mapping for clarity and control
  const mapping = {
    resolution: '--viewport',
    fullscreen: '-f',
    screenNum: '--screen',
    multiSampling: '--multi-sampling',
    noVsync: '--no-vsync',
    startDate: '--start-date',
    stopDate: '--stop-date',
    startPosition: '-p',
    stopPosition: '--stop-position',
    stopAtTime: '-t',
    stopAtEnd: '--stop-at-end',
    dontStop: '--dont-stop',
    loop: '--loop',
    autoSkipSeconds: '-a',
    disableAutoSkip: '--disable-auto-skip',
    secondsPerDay: '-s',
    realtime: '--realtime',
    noTimeTravel: '--no-time-travel',
    timeScale: '-c',
    elasticity: '-e',
    key: '--key',
    userImageDir: '--user-image-dir',
    defaultUserImage: '--default-user-image',
    fixedUserSize: '--fixed-user-size',
    colourImages: '--colour-images',
    fileIdleTime: '-i',
    fileIdleTimeAtEnd: '--file-idle-time-at-end',
    maxFiles: '--max-files',
    maxFileLag: '--max-file-lag',
    windowPosition: '--window-position',
    frameless: '--frameless',
    outputCustomLog: '--output-custom-log',
    background: '-b',
    backgroundImage: '--background-image',
    bloomMultiplier: '--bloom-multiplier',
    bloomIntensity: '--bloom-intensity',
    cameraMode: '--camera-mode',
    cropAxis: '--crop',
    padding: '--padding',
    disableAutoRotate: '--disable-auto-rotate',
    disableInput: '--disable-input',
    dateFormat: '--date-format',
    fontFile: '--font-file',
    fontScale: '--font-scale',
    fontSize: '--font-size',
    filenameFontSize: '--file-font-size',
    dirnameFontSize: '--dir-font-size',
    userFontSize: '--user-font-size',
    fontColor: '--font-colour',
    fileExtensions: '--file-extensions',
    fileExtensionFallback: '--file-extension-fallback',
    gitBranch: '--git-branch',
    hide: '--hide', // Special handling for array value needed
    logo: '--logo',
    logoOffset: '--logo-offset',
    loopDelaySeconds: '--loop-delay-seconds',
    title: '--title', // Special handling for boolean/string value needed
    transparent: '--transparent',
    userFilter: '--user-filter',
    userShowFilter: '--user-show-filter',
    fileFilter: '--file-filter',
    fileShowFilter: '--file-show-filter',
    userFriction: '--user-friction',
    userScale: '--user-scale',
    maxUserSpeed: '--max-user-speed',
    followUser: '--follow-user',
    highlightDirs: '--highlight-dirs',
    highlightUser: '--highlight-user',
    highlightUsers: '--highlight-users',
    highlightColor: '--highlight-colour',
    selectionColor: '--selection-colour',
    filenameColor: '--filename-colour',
    dirColor: '--dir-colour',
    dirNameDepth: '--dir-name-depth',
    dirNamePosition: '--dir-name-position',
    filenameTime: '--filename-time',
    captionFile: '--caption-file',
    captionSize: '--caption-size',
    captionColour: '--caption-colour',
    captionDuration: '--caption-duration',
    captionOffset: '--caption-offset',
    hashSeed: '--hash-seed',
    framerate: '--output-framerate' // Note: This is technically an output option
  };

  // Map camelCase keys in settings to kebab-case arguments
  const settingKeys = Object.keys(settings);

  for (const key of settingKeys) {
    const value = settings[key];

    // Skip if value is null, undefined, or empty string (unless it's a boolean flag where presence matters)
    if (value === null || value === undefined || value === '') continue;

    const gourceArg = mapping[key];
    if (!gourceArg) {
      // console.warn(`No Gource argument mapping found for setting key: ${key}`);
      continue;
    }

    // Handle boolean flags (arguments without values)
    if (typeof value === 'boolean') {
      if (value) {
        args += ` ${gourceArg}`;
      }
      continue; // Move to next setting
    }

    // Handle the 'hide' argument which can be an array
    if (key === 'hide' && Array.isArray(value)) {
      if (value.length > 0) {
        args += ` ${gourceArg} ${value.join(',')}`;
      }
      continue;
    }

    // Handle the 'title' argument which can be boolean or string
    if (key === 'title') {
      if (typeof value === 'string' && value.trim() !== '') {
        args += ` ${gourceArg} "${value.replace(/"/g, '\\"')}"`; // Add quotes for title text
      } else if (value === true) {
        args += ` ${gourceArg}`; // Add flag if just true
      }
      continue;
    }

    // Special handling for colors (remove # if present)
    if (['background', 'fontColor', 'dirColor', 'highlightColor', 'selectionColor', 'filenameColor', 'captionColour'].includes(key)) {
      const colorValue = typeof value === 'string' ? value.replace('#', '') : value;
      args += ` ${gourceArg} ${colorValue}`;
      continue;
    }

    // Special handling for viewport/resolution
    if (key === 'resolution') {
      args += ` ${gourceArg} ${value}`; // --viewport WIDTHxHEIGHT
      continue;
    }

    // Handle dates (ensure correct format string)
    if (key === 'startDate' || key === 'stopDate') {
      if (typeof value === 'string' && value) {
        // Ensure value is just "YYYY-MM-DD HH:MM:SS" before adding quotes
        const dateMatch = value.match(/^(\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2})/);
        if (dateMatch && dateMatch[1]) {
          args += ` ${gourceArg} "${dateMatch[1]}"`; 
        } else {
          console.warn(`Invalid date format for ${key}: ${value}. Skipping.`);
        }
      }
      continue;
    }

    // For all other arguments, add them with their values
    args += ` ${gourceArg} ${value}`;
  }

  // Note: extraArgs is not explicitly mapped, needs separate handling if required.

  // Add combined --hide arguments if any
  if (settings.hide && settings.hide.length > 0) {
    args += ` --hide ${settings.hide.join(',')}`;
  }
  
  // Ensure framerate is present for output
  if (!args.includes('--output-framerate')) {
    args += ` --output-framerate ${settings.framerate || 30}`;
  }

  // Add --user-image-dir if enabled
  if (settings.useUserImageDir === true) {
    args += ` --user-image-dir "${AVATAR_DIR_PATH}"`;
  }

  // Remove leading/trailing spaces
  return args.trim();
}

// Export for CommonJS modules (server side)
module.exports = {
  defaultGourceConfig,
  defaultSettings,
  settingsDescriptions,
  convertToGourceArgs,
  calculateDatesFromPeriod
}; 