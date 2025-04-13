/**
 * Default Gource configuration file
 * Used for all projects when no specific configuration is selected
 * This file serves as the single source of truth for default Gource settings
 * and is used by both the client and server.
 */

// Default settings for Gource
const defaultSettings = {
  // Display settings
  resolution: '1920x1080',
  framerate: 60,
  title: true,
  titleText: '', // Custom title text (empty = use project name)
  key: true,
  background: '#000000',
  
  // Time settings
  secondsPerDay: 1,
  autoSkipSeconds: 0.1,
  timeScale: 1.0,
  startDate: '',
  stopDate: '',
  
  // Camera and movement
  elasticity: 0.0, // Reduced from 0.5 to 0.0
  cameraMode: 'overview', // overview, track, follow
  
  // Visual scaling
  fontScale: 1.0,
  userScale: 1.0,
  fileScale: 1.0,
  dirSize: 1.0,
  
  // Font settings
  fontSize: 16,
  filenameFontSize: 14,
  dirnameFontSize: 14,
  userFontSize: 14,
  
  // Color settings
  fontColor: '#ffffff',
  titleColor: '#ffffff',
  dirColor: '#ffffff',
  highlightColor: '#ffffff',
  selectionColor: '#ffffff',
  
  // Users and files settings
  highlightUsers: false,
  hideUsers: '',
  hideFilesRegex: '',
  hideRoot: false,
  maxUserCount: 0,
  showUserImages: true,
  dateFormat: '%Y-%m-%d %H:%M:%S',
  
  // Special features
  showLines: false, // Show connections between users and files
  disableAutoRotate: false,
  swapTitleAndDate: false,
  
  // Advanced
  extraArgs: ''
};

// Description for each setting to display in UI tooltips
const settingsDescriptions = {
  resolution: "Video output resolution (width x height)",
  framerate: "Frames per second in output video",
  title: "Show title at the top of the visualization",
  titleText: "Custom title text (if empty, project name is used)",
  key: "Display file extension color reference",
  background: "Background color of the visualization",
  
  secondsPerDay: "How many seconds represent one day in the visualization",
  autoSkipSeconds: "Skip periods of inactivity longer than this value",
  timeScale: "Speed multiplier for time progression",
  startDate: "Start visualization from this date (YYYY-MM-DD format)",
  stopDate: "End visualization at this date (YYYY-MM-DD format)",
  
  elasticity: "Elasticity of connections between files and directories (0.0 = none)",
  cameraMode: "Camera behavior: overview (entire tree), track (move to active area), follow (follow most active user)",
  
  fontScale: "Global font size scaling factor",
  userScale: "Size of user avatars",
  fileScale: "Size of file nodes",
  dirSize: "Size of directory nodes",
  
  fontSize: "Default font size",
  filenameFontSize: "Font size for file names",
  dirnameFontSize: "Font size for directory names",
  userFontSize: "Font size for user names",
  
  fontColor: "Default text color",
  titleColor: "Title text color",
  dirColor: "Directory text and node color",
  highlightColor: "Color used for highlighting active elements",
  selectionColor: "Color used for selected elements",
  
  highlightUsers: "Highlight specific users in the visualization",
  hideUsers: "Comma-separated list of users to hide",
  hideFilesRegex: "Regular expression for files to hide",
  hideRoot: "Hide the root directory",
  maxUserCount: "Maximum number of users to show (0 = no limit)",
  showUserImages: "Show user avatar images",
  dateFormat: "Format for displayed dates",
  
  showLines: "Show connections between users and files",
  disableAutoRotate: "Disable automatic camera rotation",
  swapTitleAndDate: "Swap positions of title and date in the visualization",
  
  extraArgs: "Additional command-line arguments to pass to Gource"
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

// Export for ES modules (client-side)
export { defaultSettings, defaultGourceConfig, settingsDescriptions }; 