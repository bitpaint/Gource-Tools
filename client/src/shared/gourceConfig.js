/**
 * Shared module for Gource configurations
 * Copied from the root /shared directory to comply with CRA import rules.
 * This file serves as a single source of truth for Gource default settings
 */

// Default settings for Gource
const defaultSettings = {
  resolution: '1920x1080',
  framerate: 60,
  secondsPerDay: 1,
  autoSkipSeconds: 0.1,
  elasticity: 0.3,
  title: false,
  key: false,
  background: '#000000',
  fontScale: 1.0,
  cameraMode: 'overview',
  userScale: 1.0,
  timeScale: 1.0,
  highlightUsers: false,
  hideUsers: '',
  hideProgress: true,
  hideMouse: true,
  hideFilenames: true,
  hideRoot: true,
  hideFiles: false,
  hideDirnames: false,
  hideUsernames: false,
  hideDate: false,
  hideTree: false,
  hideBloom: false,
  maxUserCount: 0,
  titleText: '',
  showDates: false,
  disableProgress: true,
  disableAutoRotate: false,
  showLines: true,
  followUsers: false,
  maxFilelag: 0.5,
  multiSampling: true,
  bloom: true,
  bloomIntensity: 0.5,
  bloomMultiplier: 0.7,
  extraArgs: '',
  dateFormat: '%Y-%m-%d',
  timePeriod: 'all',
  startDate: '',
  stopDate: '',
  startPosition: '',
  stopPosition: '',
  stopAtTime: 0,
  loop: false,
  loopDelaySeconds: 5,
  fontSize: 16,
  filenameFontSize: 14,
  dirnameFontSize: 20,
  userFontSize: 13,
  fontColor: '#FFFFFF',
  dirColor: '#FFFFFF',
  highlightColor: '#FF0000',
  selectionColor: '#FFFF00',
  filenameColor: '#FFFFFF',
  transparent: false,
  dirNameDepth: 1,
  dirNamePosition: 1.0,
  filenameTime: 4.0,
  maxFiles: 0,
  fileIdleTime: 0,
  fileIdleTimeAtEnd: 0,
  fileExtensions: false,
  fileExtensionFallback: false,
  useUserImageDir: true,
  defaultUserImage: '',
  fixedUserSize: false,
  colourImages: false,
  userFriction: 0.67,
  maxUserSpeed: 500,
  backgroundImage: '',
  logo: '',
  logoOffset: '',
  fullscreen: false,
  screenNum: 0,
  noVsync: false,
  windowPosition: '',
  frameless: false,
  cropAxis: '',
  padding: 1.15,
  stopAtEnd: true,
  dontStop: false,
  disableAutoSkip: false,
  realtime: false,
  noTimeTravel: false,
  highlightDirs: false,
  disableInput: false,
  hashSeed: '',
  userShowFilter: '',
  fileFilter: '(\\.svg$|\\/node_modules\\/)',
  fileShowFilter: '',
  highlightUser: '',
  captionFile: '',
  captionSize: 12,
  captionColour: '#FFFFFF',
  captionDuration: 10.0,
  captionOffset: 0,
  fontFile: '',
  followUser: '',
  outputCustomLog: '',
  gitBranch: ''
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
  title: "Displays the project title at the top of the visualization (Now disabled by default)",
  key: "Displays the legend for file types (Now hidden by default)",
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
  bloom: "Adds a bloom effect to bright elements (Now enabled by default)",
  bloomIntensity: "Intensity of the bloom effect (0.0-1.0, default 0.5)",
  bloomMultiplier: "Multiplier for the bloom effect (0.0-1.0)",
  extraArgs: "Additional arguments to pass directly to Gource",
  dateFormat: "Format string for the date display (strftime format, e.g., '%Y-%m-%d')",
  timePeriod: "Time period filter: 'all', 'week' (last 7 days), 'month' (last 30 days), 'year' (last 365 days)",
  startDate: "Start date for the visualization (format: YYYY-MM-DD)",
  stopDate: "End date for the visualization (format: YYYY-MM-DD)",
  startPosition: "Start at a specific position (0.0 to 1.0, or 'random')",
  stopPosition: "Stop at a specific position (0.0 to 1.0)",
  stopAtTime: "Stop rendering after a specific number of seconds (0 to disable)",
  loop: "Loop the visualization when it ends",
  loopDelaySeconds: "Seconds to pause before looping (default: 5)",
  fontSize: "Default font size (for title, date)",
  filenameFontSize: "Font size for filenames",
  dirnameFontSize: "Font size for directory names (default: 20)",
  userFontSize: "Font size for user names (default: 13)",
  fontColor: "Default font color (for title, date)",
  dirColor: "Font color for directory names",
  highlightColor: "Font color for highlighted users/directories",
  selectionColor: "Font color for selected users/files",
  transparent: "Make the background transparent (useful for overlays)",
  filenameColor: "Font color for filenames",
  dirNameDepth: "Draw directory names down to this depth (default: 1)",
  dirNamePosition: "Position directory names along the edge (0.0 to 1.0, default: 1.0)",
  filenameTime: "Duration filenames remain on screen (seconds)",
  maxFiles: "Maximum number of files displayed (0 for unlimited)",
  fileIdleTime: "Time files remain on screen after activity (seconds, default 0)",
  fileIdleTimeAtEnd: "Time files remain on screen at the very end (seconds, default 0)",
  fileExtensions: "Show only file extensions instead of full filenames",
  fileExtensionFallback: "Use filename if extension is missing (requires --file-extensions)",
  useUserImageDir: "Attempt to load user avatars from the ./avatars directory",
  defaultUserImage: "Path to an image file to use if a specific user avatar is not found",
  fixedUserSize: "Users avatars maintain a fixed size instead of scaling",
  colourImages: "Apply coloring to user avatars",
  userFriction: "Rate at which users slow down after moving (0.0 to 1.0)",
  maxUserSpeed: "Maximum speed users can travel (units per second)",
  backgroundImage: "Path to an image file to use as the background",
  logo: "Path to an image file to display as a foreground logo",
  logoOffset: "Offset position of the logo (format: XxY, e.g., 10x10)",
  fullscreen: "Run Gource in fullscreen mode",
  screenNum: "Select the screen number for fullscreen mode",
  noVsync: "Disable vertical sync (can cause tearing)",
  windowPosition: "Initial window position (format: XxY, e.g., 100x50)",
  frameless: "Run Gource in a borderless window",
  cropAxis: "Crop the view on an axis ('vertical' or 'horizontal')",
  padding: "Camera view padding around the content (default: 1.15)",
  stopAtEnd: "Stop simulation automatically at the end of the log (Now enabled by default)",
  dontStop: "Keep running (camera rotating) after the log ends",
  disableAutoSkip: "Prevent automatically skipping periods of inactivity",
  realtime: "Attempt to playback at realtime speed",
  noTimeTravel: "Use the time of the last commit if a commit time is in the past",
  highlightDirs: "Highlight the names of all directories",
  disableInput: "Disable keyboard and mouse input during visualization",
  hashSeed: "Seed for the hash function (affects layout)",
  userShowFilter: "Show only usernames matching this regex",
  fileShowFilter: "Show only file paths matching this regex",
  highlightUser: "Highlight a specific user by name",
  captionFile: "Path to a caption file to display timed text",
  captionSize: "Font size for captions",
  captionColour: "Font color for captions (hex)",
  captionDuration: "Default duration captions remain on screen (seconds)",
  captionOffset: "Horizontal offset for captions",
  fontFile: "Path to a font file (.ttf, .otf) to use for text rendering",
  followUser: "Camera will automatically follow this specific user",
  outputCustomLog: "Output a Gource custom format log file during processing (useful for debugging)",
  gitBranch: "Specify git branch when Gource generates its own log (limited use when providing custom log)",
  hideProgress: "Hides the progress bar (Now hidden by default)",
  hideMouse: "Hides the mouse cursor (Now hidden by default)",
  hideFilenames: "Hides filenames (Now hidden by default)",
  fileFilter: "Regular expression to hide certain file paths (default hides .svg and node_modules)"
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
  
  // Explicit mapping for clarity and control (fixed mapping with Gource command flags)
  const mapping = {
    // Basic parameters
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
    dateFormat: '--date-format',
    
    // User & avatar options
    userImageDir: '--user-image-dir',
    defaultUserImage: '--default-user-image',
    fixedUserSize: '--fixed-user-size',
    colourImages: '--colour-images',
    userFriction: '--user-friction',
    userScale: '--user-scale',
    maxUserSpeed: '--max-user-speed',
    followUser: '--follow-user',
    highlightUser: '--highlight-user',
    highlightUsers: '--highlight-users',
    highlightDirs: '--highlight-dirs',
    
    // File options
    fileIdleTime: '-i',
    fileIdleTimeAtEnd: '--file-idle-time-at-end',
    maxFiles: '--max-files',
    maxFileLag: '--max-file-lag',
    filenameTime: '--filename-time',
    fileExtensions: '--file-extensions',
    fileExtensionFallback: '--file-extension-fallback',
    
    // Filters & regex
    userFilter: '--user-filter',
    userShowFilter: '--user-show-filter',
    fileFilter: '--file-filter',
    fileShowFilter: '--file-show-filter',
    
    // Window & output options
    windowPosition: '--window-position',
    frameless: '--frameless',
    outputCustomLog: '--output-custom-log',
    
    // Appearance options
    background: '-b',
    backgroundImage: '--background-image',
    transparent: '--transparent',
    bloomMultiplier: '--bloom-multiplier',
    bloomIntensity: '--bloom-intensity',
    cameraMode: '--camera-mode',
    cropAxis: '--crop',
    padding: '--padding',
    disableAutoRotate: '--disable-auto-rotate',
    disableInput: '--disable-input',
    
    // Font & text options
    fontFile: '--font-file',
    fontScale: '--font-scale',
    fontSize: '--font-size',
    filenameFontSize: '--file-font-size',
    dirnameFontSize: '--dir-font-size',
    userFontSize: '--user-font-size',
    fontColor: '--font-colour',
    dirColor: '--dir-colour',
    highlightColor: '--highlight-colour',
    selectionColor: '--selection-colour',
    filenameColor: '--filename-colour',
    dirNameDepth: '--dir-name-depth',
    dirNamePosition: '--dir-name-position',
    
    // Logo & caption options
    logo: '--logo',
    logoOffset: '--logo-offset',
    loopDelaySeconds: '--loop-delay-seconds',
    captionFile: '--caption-file',
    captionSize: '--caption-size',
    captionColour: '--caption-colour',
    captionDuration: '--caption-duration',
    captionOffset: '--caption-offset',
    
    // Misc
    gitBranch: '--git-branch',
    hashSeed: '--hash-seed',
    title: '--title', // Special handling needed
    framerate: '--output-framerate' // Output option
  };

  // "hide" elements mapping - from our UI settings to Gource command line parameters
  // We need to convert these boolean flags into a comma-separated list for --hide
  const hideElementsMapping = {
    hideRoot: 'root',
    hideUsers: 'users',
    hideFiles: 'files',
    hideFilenames: 'filenames',
    hideDirnames: 'dirnames',
    hideUsernames: 'usernames',
    hideDate: 'date',
    hideProgress: 'progress',
    hideMouse: 'mouse',
    hideTree: 'tree',
    hideBloom: 'bloom'
  };

  // Process hide elements first to collect them
  let hideElements = [];
  for (const [settingKey, hideValue] of Object.entries(hideElementsMapping)) {
    // If the setting exists and is true, add the element to hide
    if (settings[settingKey] === true) {
      hideElements.push(hideValue);
    }
  }
  // Explicitly add 'title' to hide if settings.title is false
  if (settings.title === false) {
    if (!hideElements.includes('title')) { // Avoid adding duplicates if hideTitle was a theoretical setting
       hideElements.push('title');
    }
  }

  // Process title and titleText first, to ensure they're handled properly
  // Only add --title flag if settings.title is explicitly true
  if (settings.title === true) {
    // If title is true and titleText exists, use that for the title
    if (settings.titleText && typeof settings.titleText === 'string' && settings.titleText.trim() !== '') {
      args += ` --title "${settings.titleText.replace(/"/g, '\\"')}"`;
    } else {
      // Otherwise just enable the title flag (Gource uses default name or similar)
      // We don't add value-less --title here, handled by hide logic if false
      // Potentially, Gource defaults to showing something if --title is absent and not hidden
      // Let's rely on the hide logic above for explicit hiding
    }
  } // No else block needed, hiding is handled above

  // Now process other settings, skipping those we've already handled
  for (const key of Object.keys(settings)) {
    // Skip already processed settings
    if (key === 'title' || key === 'titleText' || key in hideElementsMapping) continue;
    
    const value = settings[key];

    // Skip if value is null, undefined, or empty string
    if (value === null || value === undefined || value === '') continue;

    const gourceArg = mapping[key];
    if (!gourceArg) {
      // Not every UI setting maps to a Gource parameter, so we'll just skip unmapped ones
      continue;
    }

    // Handle boolean flags (arguments without values)
    if (typeof value === 'boolean') {
      // For boolean flags, we only include the argument if true
      if (value) {
        args += ` ${gourceArg}`;
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

    // Handle dates (ensure correct format with quotes)
    if (key === 'startDate' || key === 'stopDate') {
      if (typeof value === 'string' && value) {
        // Ensure value is "YYYY-MM-DD HH:MM:SS" before adding quotes
        const dateMatch = value.match(/^(\d{4}-\d{2}-\d{2}( \d{2}:\d{2}:\d{2})?)/);
        if (dateMatch && dateMatch[1]) {
          // If time component is missing, add it
          const dateStr = dateMatch[1].includes(' ') ? dateMatch[1] : `${dateMatch[1]} 00:00:00`;
          args += ` ${gourceArg} "${dateStr}"`; 
        } else {
          console.warn(`Invalid date format for ${key}: ${value}. Skipping.`);
        }
      }
      continue;
    }

    // For all other arguments, add them with their values
    args += ` ${gourceArg} ${value}`;
  }

  // Add collected hide elements if any
  if (hideElements.length > 0) {
    args += ` --hide ${hideElements.join(',')}`;
  }
  
  // Ensure framerate is present for output
  if (!args.includes('--output-framerate')) {
    args += ` --output-framerate ${settings.framerate || 60}`;
  }

  // Add --user-image-dir if enabled
  if (settings.useUserImageDir === true) {
    args += ` --user-image-dir "${AVATAR_DIR_PATH}"`;
  }
  
  // Special handling for file-extensions flag
  if (settings.fileExtensions === true && !args.includes('--file-extensions')) {
    args += ` --file-extensions`;
  }

  // Remove leading/trailing spaces
  return args.trim();
}

// Use standard ES Module exports for the client-side (CRA)
export {
  defaultGourceConfig,
  defaultSettings,
  settingsDescriptions,
  convertToGourceArgs,
  calculateDatesFromPeriod
}; 