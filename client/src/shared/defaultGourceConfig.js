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
  'title-text': '', // Custom title text (empty = use project name)
  key: true,
  background: '#000000',
  
  // Time settings
  'seconds-per-day': 1,
  'auto-skip-seconds': 0.1,
  'time-scale': 1.0,
  'start-date': '',
  'stop-date': '',
  
  // Camera and movement
  elasticity: 0.0, // Reduced from 0.5 to 0.0
  'camera-mode': 'overview', // overview, track, follow
  
  // Visual scaling
  'font-scale': 1.0,
  'user-scale': 1.0,
  'file-scale': 1.0,
  'dir-size': 1.0,
  
  // Font settings
  'font-size': 16,
  'filename-font-size': 14,
  'dirname-font-size': 14,
  'user-font-size': 14,
  
  // Color settings
  'font-color': '#ffffff',
  'title-color': '#ffffff',
  'dir-color': '#ffffff',
  'highlight-color': '#ffffff',
  'selection-color': '#ffffff',
  
  // Users and files settings
  'highlight-users': false,
  'hide-users': '',
  'hide-files-regex': '',
  'hide-root': false,
  'max-user-count': 0,
  'user-image-dir': '', // Directory for user avatar images
  'date-format': '%Y-%m-%d %H:%M:%S',
  
  // Special features
  'show-lines': false, // Show connections between users and files
  'disable-auto-rotate': false,
  'swap-title-date': false,
  
  // Advanced
  'extra-args': ''
};

// Description for each setting to display in UI tooltips
const settingsDescriptions = {
  resolution: "Video output resolution (width x height)",
  framerate: "Frames per second in output video",
  title: "Show title at the top of the visualization",
  'title-text': "Custom title text (if empty, project name is used)",
  key: "Display file extension color reference",
  background: "Background color of the visualization",
  
  'seconds-per-day': "How many seconds represent one day in the visualization",
  'auto-skip-seconds': "Skip periods of inactivity longer than this value",
  'time-scale': "Speed multiplier for time progression",
  'start-date': "Start visualization from this date (YYYY-MM-DD format)",
  'stop-date': "End visualization at this date (YYYY-MM-DD format)",
  
  elasticity: "Elasticity of connections between files and directories (0.0 = none)",
  'camera-mode': "Camera behavior: overview (entire tree), track (move to active area), follow (follow most active user)",
  
  'font-scale': "Global font size scaling factor",
  'user-scale': "Size of user avatars",
  'file-scale': "Size of file nodes",
  'dir-size': "Size of directory nodes",
  
  'font-size': "Default font size",
  'filename-font-size': "Font size for file names",
  'dirname-font-size': "Font size for directory names",
  'user-font-size': "Font size for user names",
  
  'font-color': "Default text color",
  'title-color': "Title text color",
  'dir-color': "Directory text and node color",
  'highlight-color': "Color used for highlighting active elements",
  'selection-color': "Color used for selected elements",
  
  'highlight-users': "Highlight specific users in the visualization",
  'hide-users': "Comma-separated list of users to hide",
  'hide-files-regex': "Regular expression for files to hide",
  'hide-root': "Hide the root directory",
  'max-user-count': "Maximum number of users to show (0 = no limit)",
  'user-image-dir': "Directory containing user avatar images",
  'date-format': "Format for displayed dates",
  
  'show-lines': "Show connections between users and files",
  'disable-auto-rotate': "Disable automatic camera rotation",
  'swap-title-date': "Swap positions of title and date in the visualization",
  
  'extra-args': "Additional command-line arguments to pass to Gource"
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