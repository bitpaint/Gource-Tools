/**
 * This file defines the initial system Gource configurations.
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

// Define the default settings common to system configurations
const defaultSystemSettings = {
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
  cameraMode: 'overview',
  userFontSize: 13,
  dirnameFontSize: 20,
  dirNamePosition: 1.0,
  dirNameDepth: 1,
  fileFilter: '(\\.svg$|\\/node_modules\\/)',
  dateFormat: '%Y-%m-%d',
  key: false,
};

// -- System Gource Configurations --
const systemGourceConfigs = [
  {
    id: 'everything_1m',
    name: 'Everything in 1 min',
    description: 'Visualize the entire project history compressed into approximately 1 minute.',
    isDefault: true, // Mark this as the default config
    isSystemConfig: true, // Cannot be edited or deleted by user
    settings: {
      ...defaultSystemSettings,
      secondsPerDay: 'auto-60s',
      outputFramerate: 30,
      autoSkipSeconds: 0.1,
      hide: ['date'],
      bloomMultiplier: 1.2,
      title: '{projectName} - Full History ({duration} min)',
      stopPosition: '1.0',
      hideProgress: false, hideMouse: false, hideFilenames: false, hideRoot: false, hideDate: true
    }
  },
  {
    id: 'last_week_1m',
    name: 'Last Week in 1 min',
    description: 'Visualize the last 7 days of activity compressed into approximately 1 minute.',
    isSystemConfig: true,
    settings: {
      ...defaultSystemSettings,
      startDate: 'relative-7d',
      secondsPerDay: 'auto-60s',
      outputFramerate: 30,
      autoSkipSeconds: 0.1,
      title: '{projectName} - Last 7 Days ({duration} min)',
      stopPosition: '1.0'
    }
  },
  {
    id: 'last_month_1m',
    name: 'Last Month in 1 min',
    description: 'Visualize the last 30 days of activity compressed into approximately 1 minute.',
    isSystemConfig: true,
    settings: {
      ...defaultSystemSettings,
      startDate: 'relative-30d',
      secondsPerDay: 'auto-60s',
      outputFramerate: 30,
      autoSkipSeconds: 0.1,
      title: '{projectName} - Last 30 Days ({duration} min)',
      stopPosition: '1.0'
    }
  },
  {
    id: 'last_year_1m',
    name: 'Last Year in 1 min',
    description: 'Visualize the last 365 days of activity compressed into approximately 1 minute.',
    isSystemConfig: true,
    settings: {
      ...defaultSystemSettings,
      startDate: 'relative-365d',
      secondsPerDay: 'auto-60s',
      outputFramerate: 30,
      autoSkipSeconds: 0.1,
      title: '{projectName} - Last Year ({duration} min)',
      stopPosition: '1.0'
    }
  }
  // Add more system configs here if needed
];

module.exports = systemGourceConfigs; 