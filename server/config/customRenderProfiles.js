/**
 * This file defines additional profiles for specific renderings
 */

// Function to get ISO date string for X days ago
function getDateXDaysAgo(days) {
  const date = new Date();
  date.setDate(date.getDate() - days);
  return date.toISOString().split('T')[0]; // Return YYYY-MM-DD format
}

// Function to get ISO date string for start of the current week (Sunday)
function getStartOfWeek() {
  const date = new Date();
  const dayOfWeek = date.getDay(); // 0=Sun, 1=Mon, ...
  date.setDate(date.getDate() - dayOfWeek);
  return date.toISOString().split('T')[0];
}

// Function to get ISO date string for start of the current month
function getStartOfMonth() {
  const date = new Date();
  date.setDate(1);
  return date.toISOString().split('T')[0];
}

// Function to get ISO date string for start of the current year
function getStartOfYear() {
  const date = new Date();
  date.setMonth(0, 1);
  return date.toISOString().split('T')[0];
}

// Define the new default settings to be merged
const newDefaultSettings = {
  resolution: '1920x1080',
  framerate: 60,
  stopAtEnd: true,
  loopDelaySeconds: 5,
  padding: 1.15,
  bloom: true,
  bloomIntensity: 0.5,
  hideProgress: true,
  hideMouse: true,
  hideFilenames: true,
  hideRoot: true,
  hideFiles: false,
  cameraMode: 'overview',
  userFontSize: 13,
  dirnameFontSize: 20,
  dirNamePosition: 1.0,
  dirNameDepth: 1,
  fileFilter: '(\\.svg$|\\/node_modules\\/)',
  dateFormat: '%Y-%m-%d',
  key: false,
  highlightDirs: true,
  highlightUsers: true,
  // Include other relevant defaults if needed, but focus on user request
};

// -- Custom Render Profiles --
const customRenderProfiles = [
  {
    id: 'everything_1m',
    name: 'Everything in 1 min',
    description: 'Visualize the entire project history compressed into approximately 1 minute.',
    isDefault: true, // Mark this as the default profile
    isSystemProfile: true, // Cannot be edited or deleted by user
    settings: {
      // Merge new defaults, keeping specific overrides
      ...newDefaultSettings,
      // --- Specific overrides for this profile --- 
      secondsPerDay: 'auto-60s', 
      outputFramerate: 30, // Override default framerate
      autoSkipSeconds: 0.1, // Specific value
      hide: ['date'], // Override hide settings
      bloomMultiplier: 1.2, // Specific value
      title: '{projectName} - Full History ({duration} min)', // Specific title
      stopPosition: '1.0', // Specific setting
      // Ensure boolean hide flags from defaults don't conflict with explicit hide array
      hideProgress: false, hideMouse: false, hideFilenames: false, hideRoot: false, hideDate: true 
    }
  },
  {
    id: 'last_week_1m',
    name: 'Last Week in 1 min',
    description: 'Visualize the last 7 days of activity compressed into approximately 1 minute.',
    isSystemProfile: true,
    settings: {
      // Merge new defaults, keeping specific overrides
      ...newDefaultSettings,
      // --- Specific overrides for this profile --- 
      startDate: 'relative-7d',
      secondsPerDay: 'auto-60s',
      outputFramerate: 30,
      autoSkipSeconds: 0.1,
      title: '{projectName} - Last 7 Days ({duration} min)',
      stopPosition: '1.0'
      // Inherits hide settings from new defaults unless explicitly set here
    }
  },
  {
    id: 'last_month_1m',
    name: 'Last Month in 1 min',
    description: 'Visualize the last 30 days of activity compressed into approximately 1 minute.',
    isSystemProfile: true,
    settings: {
      // Merge new defaults, keeping specific overrides
      ...newDefaultSettings,
      // --- Specific overrides for this profile --- 
      startDate: 'relative-30d',
      secondsPerDay: 'auto-60s',
      outputFramerate: 30,
      autoSkipSeconds: 0.1,
      title: '{projectName} - Last 30 Days ({duration} min)',
      stopPosition: '1.0'
      // Inherits hide settings from new defaults unless explicitly set here
    }
  },
  {
    id: 'last_year_1m',
    name: 'Last Year in 1 min',
    description: 'Visualize the last 365 days of activity compressed into approximately 1 minute.',
    isSystemProfile: true,
    settings: {
      // Merge new defaults, keeping specific overrides
      ...newDefaultSettings,
      // --- Specific overrides for this profile --- 
      startDate: 'relative-365d',
      secondsPerDay: 'auto-60s',
      outputFramerate: 30,
      autoSkipSeconds: 0.1,
      title: '{projectName} - Last Year ({duration} min)',
      stopPosition: '1.0'
      // Inherits hide settings from new defaults unless explicitly set here
    }
  },
  {
    id: 'realtime_overview',
    name: 'Realtime Overview',
    description: 'Visualize activity at approximately realtime speed.',
    isSystemProfile: true,
    settings: {
      // Merge new defaults, keeping specific overrides
      ...newDefaultSettings,
      // --- Specific overrides for this profile --- 
      realtime: true, // Key setting
      secondsPerDay: '1', // Use a fixed reasonable speed with realtime
      autoSkipSeconds: 1, // Slightly longer skip for realtime
      title: '{projectName} - Realtime'
      // Inherits hide settings from new defaults unless explicitly set here
    }
  }
  // Add more system profiles here if needed
];

module.exports = customRenderProfiles; 